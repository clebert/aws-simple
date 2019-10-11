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

export async function uploadToS3(context: Context): Promise<void> {
  const {
    appConfig: {customDomainConfig, s3Configs = []},
    stackName
  } = context;

  const clientConfig = await createClientConfig();
  const cloudFormation = new CloudFormation(clientConfig);
  const stack = await findStack(context, cloudFormation);
  const stackOutputs = getStackOutputs(context, stack);

  const createBaseUrl = () => {
    if (!customDomainConfig) {
      return stackOutputs.restApiUrl;
    }

    const {hostedZoneName, getAliasRecordName} = customDomainConfig;

    return getAliasRecordName
      ? `https://${getAliasRecordName(stackName)}.${hostedZoneName}`
      : `https://${hostedZoneName}`;
  };

  const baseUrl = createBaseUrl();
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

            const url =
              type === 'file'
                ? joinUrl(baseUrl, publicPath)
                : joinUrl(baseUrl, publicPath, path.basename(filename));

            listrTask.title = `Successfully uploaded file: ${url}`;
          } catch (error) {
            listrTask.title = `Error while uploading file: ${filename}`;

            throw error;
          }
        }
      });
    }
  }

  await new Listr(listrTasks, {concurrent: true, exitOnError: true}).run();
}
