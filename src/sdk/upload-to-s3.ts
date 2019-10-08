import {CloudFormation, S3} from 'aws-sdk';
import {readFileSync} from 'fs';
import Listr from 'listr';
import mimeTypes from 'mime-types';
import * as path from 'path';
import joinUrl from 'url-join';
import {DeploymentDescriptor} from '../utils/deployment-descriptor';
import {getAbsoluteFilenames} from '../utils/get-absolute-filenames';
import {SdkConfig, createClientConfig} from './create-client-config';
import {findStack} from './find-stack';
import {getStackOutputs} from './get-stack-outputs';

export async function uploadToS3(
  deploymentDescriptor: DeploymentDescriptor,
  sdkConfig: SdkConfig
): Promise<void> {
  const clientConfig = await createClientConfig(sdkConfig);
  const cloudFormation = new CloudFormation(clientConfig);
  const stack = await findStack(deploymentDescriptor, cloudFormation);
  const stackOutputs = getStackOutputs(deploymentDescriptor, stack);

  const {
    appConfig: {customDomainConfig, s3Configs = []}
  } = deploymentDescriptor;

  const createUrl = () => {
    if (!customDomainConfig) {
      return stackOutputs.restApiUrl;
    }

    const {hostedZoneName, aliasRecordName} = customDomainConfig;

    return aliasRecordName
      ? `https://${aliasRecordName}.${hostedZoneName}`
      : `https://${hostedZoneName}`;
  };

  const url = createUrl();
  const listrTasks: Listr.ListrTask[] = [];
  const s3 = new S3(clientConfig);

  for (const s3Config of s3Configs) {
    const {type, publicPath, bucketPath = publicPath} = s3Config;

    for (const filename of getAbsoluteFilenames(s3Config)) {
      listrTasks.push({
        title: `Uploading file: ${filename}`,
        task: async (_, listrTask) => {
          try {
            await s3
              .upload({
                ContentType: mimeTypes.lookup(filename) || undefined,
                Bucket: stackOutputs.s3BucketName,
                Key: (type === 'folder'
                  ? path.join(bucketPath, path.basename(filename))
                  : bucketPath
                ).replace(/^\//, ''),
                Body: readFileSync(filename)
              })
              .promise();

            listrTask.title = `Uploaded file: ${joinUrl(
              url,
              publicPath,
              type === 'folder' ? path.basename(filename) : ''
            )}`;
          } catch (error) {
            listrTask.title = error.message;

            throw error;
          }
        }
      });
    }
  }

  await new Listr(listrTasks, {concurrent: true}).run();
}
