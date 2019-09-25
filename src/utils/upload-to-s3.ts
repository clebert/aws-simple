import {
  CloudFormation,
  CredentialProviderChain,
  Credentials,
  S3,
  SharedIniFileCredentials
} from 'aws-sdk';
import {readFileSync} from 'fs';
import Listr from 'listr';
import mimeTypes from 'mime-types';
import * as path from 'path';
import joinUrl from 'url-join';
import {AppConfig, OutputIds, ResourceIds} from './app-config';
import {getFilenames} from './get-filenames';

export interface AwsConfig {
  readonly profile: string;
  readonly region: string;
}

async function getCredentials(profile: string): Promise<Credentials> {
  const providers = [() => new SharedIniFileCredentials({profile})];
  const credentialProviderChain = new CredentialProviderChain(providers);

  return credentialProviderChain.resolvePromise();
}

async function getStackOutputs(
  resourceIds: ResourceIds,
  clientConfig: CloudFormation.ClientConfiguration
): Promise<CloudFormation.Outputs | undefined> {
  const cloudFormation = new CloudFormation(clientConfig);

  const result = await cloudFormation
    .describeStacks({StackName: resourceIds.stack})
    .promise();

  return result.Stacks && result.Stacks[0].Outputs;
}

function getRestApiUrl(
  outputIds: OutputIds,
  stackOutputs: CloudFormation.Outputs
): string {
  const stackOutput = stackOutputs.find(
    ({ExportName}) => ExportName === outputIds.restApiUrl
  );

  const outputValue = stackOutput && stackOutput.OutputValue;

  if (!outputValue) {
    throw new Error(`REST API URL not found.`);
  }

  return outputValue;
}

function getS3BucketName(
  outputIds: OutputIds,
  stackOutputs: CloudFormation.Outputs
): string {
  const stackOutput = stackOutputs.find(
    ({ExportName}) => ExportName === outputIds.s3BucketName
  );

  const outputValue = stackOutput && stackOutput.OutputValue;

  if (!outputValue) {
    throw new Error(`S3 bucket name not found.`);
  }

  return outputValue;
}

export async function uploadToS3(
  appConfig: AppConfig,
  awsConfig: AwsConfig
): Promise<void> {
  const {outputIds, resourceIds, stackConfig} = appConfig;
  const {customDomainConfig, s3Configs = []} = stackConfig;
  const {profile, region} = awsConfig;
  const clientConfig = {credentials: await getCredentials(profile), region};
  const stackOutputs = await getStackOutputs(resourceIds, clientConfig);

  if (!stackOutputs) {
    throw new Error(`Stack not found.`);
  }

  const s3BucketName = getS3BucketName(outputIds, stackOutputs);

  const createUrl = () => {
    if (!customDomainConfig) {
      return getRestApiUrl(outputIds, stackOutputs);
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

    for (const filename of getFilenames(s3Config)) {
      listrTasks.push({
        title: `Uploading file: ${filename}`,
        task: async (_, listrTask) => {
          try {
            await s3
              .upload({
                ContentType: mimeTypes.lookup(filename) || undefined,
                Bucket: s3BucketName,
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
