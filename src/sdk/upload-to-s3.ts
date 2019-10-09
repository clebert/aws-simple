import {CloudFormation, S3} from 'aws-sdk';
import {readFileSync} from 'fs';
import Listr from 'listr';
import mimeTypes from 'mime-types';
import * as path from 'path';
import joinUrl from 'url-join';
import {Context} from '../context';
import {resolveFilenames} from '../utils/resolve-filenames';
import {createClientConfig} from './create-client-config';
import {findStack} from './find-stack';
import {getStackOutputs} from './get-stack-outputs';

export async function uploadToS3(
  context: Context,
  profile: string
): Promise<void> {
  const {
    appConfig: {stackName, region, customDomainConfig, s3Configs = []}
  } = context;

  const clientConfig = await createClientConfig(profile, region);
  const cloudFormation = new CloudFormation(clientConfig);
  const stack = await findStack(context, cloudFormation);
  const stackOutputs = getStackOutputs(context, stack);

  const createUrl = () => {
    if (!customDomainConfig) {
      return stackOutputs.restApiUrl;
    }

    const {hostedZoneName, getAliasRecordName} = customDomainConfig;

    return getAliasRecordName
      ? `https://${getAliasRecordName(stackName)}.${hostedZoneName}`
      : `https://${hostedZoneName}`;
  };

  const url = createUrl();
  const listrTasks: Listr.ListrTask[] = [];
  const s3 = new S3(clientConfig);

  for (const s3Config of s3Configs) {
    const {type, publicPath, bucketPath = publicPath} = s3Config;

    for (const filename of resolveFilenames(s3Config)) {
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
