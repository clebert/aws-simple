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
import {StackConfig} from '..';
import {OutputId} from '../constants/output-id';
import {ResourceId} from '../constants/resource-id';
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
  stackId: string,
  clientConfig: CloudFormation.ClientConfiguration
): Promise<CloudFormation.Outputs | undefined> {
  const cloudFormation = new CloudFormation(clientConfig);

  const result = await cloudFormation
    .describeStacks({StackName: ResourceId.forStack(stackId)})
    .promise();

  return result.Stacks && result.Stacks[0].Outputs;
}

function getRestApiUrl(
  stackId: string,
  stackOutputs: CloudFormation.Outputs
): string {
  const stackOutput = stackOutputs.find(
    ({ExportName}) => ExportName === OutputId.forRestApiUrl(stackId)
  );

  const outputValue = stackOutput && stackOutput.OutputValue;

  if (!outputValue) {
    throw new Error(`REST API URL not found.`);
  }

  return outputValue;
}

function getS3BucketName(
  stackId: string,
  stackOutputs: CloudFormation.Outputs
): string {
  const stackOutput = stackOutputs.find(
    ({ExportName}) => ExportName === OutputId.forS3BucketName(stackId)
  );

  const outputValue = stackOutput && stackOutput.OutputValue;

  if (!outputValue) {
    throw new Error(`S3 bucket name not found.`);
  }

  return outputValue;
}

export async function uploadToS3(
  stackConfig: StackConfig,
  awsConfig: AwsConfig
): Promise<void> {
  const {stackId, customDomainConfig, s3Configs = []} = stackConfig;
  const {profile, region} = awsConfig;
  const clientConfig = {credentials: await getCredentials(profile), region};
  const s3 = new S3(clientConfig);
  const stackOutputs = await getStackOutputs(stackId, clientConfig);

  if (!stackOutputs) {
    throw new Error(`Stack not found: ${stackId}`);
  }

  const s3BucketName = getS3BucketName(stackId, stackOutputs);

  const createUrl = () => {
    if (!customDomainConfig) {
      return getRestApiUrl(stackId, stackOutputs);
    }

    const {hostedZoneName, aliasRecordName} = customDomainConfig;

    return aliasRecordName
      ? `https://${aliasRecordName}.${hostedZoneName}`
      : `https://${hostedZoneName}`;
  };

  const url = createUrl();
  const listrTasks: Listr.ListrTask[] = [];

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
