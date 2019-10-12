import {CloudFormation, S3} from 'aws-sdk';
import chalk from 'chalk';
import Listr from 'listr';
import prompts from 'prompts';
import {Context} from '../context';
import {getAgeInDays} from '../utils/get-age-in-days';
import {printStacksTable} from '../utils/print-stacks-table';
import {createClientConfig} from './create-client-config';
import {findAllStacks} from './find-all-stacks';
import {getStackOutputs} from './get-stack-outputs';

export interface CleanUpAllStacksConfig {
  readonly maxAgeInDays: number;
  readonly tagNamesToPreserve: string[];
  readonly autoConfirm: boolean;
}

function isExpired(
  stack: CloudFormation.Stack,
  config: CleanUpAllStacksConfig
): boolean {
  const {CreationTime, Tags = []} = stack;
  const {maxAgeInDays, tagNamesToPreserve} = config;

  return (
    getAgeInDays(CreationTime) > maxAgeInDays &&
    !Tags.some(({Key}) => tagNamesToPreserve.some(tagName => tagName === Key))
  );
}

async function deleteS3Bucket(
  context: Context,
  s3: S3,
  stack: CloudFormation.Stack
): Promise<void> {
  const {s3BucketName} = getStackOutputs(context, stack);

  const {Contents = []} = await s3
    .listObjects({Bucket: s3BucketName})
    .promise();

  const objectIdentifiers = Contents.filter(
    ({Key}) => typeof Key === 'string'
  ).map(({Key}) => ({Key} as S3.ObjectIdentifier));

  await s3
    .deleteObjects({Bucket: s3BucketName, Delete: {Objects: objectIdentifiers}})
    .promise();

  await s3.deleteBucket({Bucket: s3BucketName}).promise();
}

async function deleteStack(
  context: Context,
  cloudFormation: CloudFormation,
  s3: S3,
  stack: CloudFormation.Stack
): Promise<void> {
  const {StackName} = stack;

  await cloudFormation.deleteStack({StackName}).promise();
  await deleteS3Bucket(context, s3, stack);

  await cloudFormation
    .waitFor('stackDeleteComplete', {
      StackName,
      $waiter: {delay: 5, maxAttempts: 60}
    })
    .promise();
}

export async function cleanUpStacks(
  context: Context,
  config: CleanUpAllStacksConfig
): Promise<void> {
  const clientConfig = await createClientConfig();
  const cloudFormation = new CloudFormation(clientConfig);
  const stacks = await findAllStacks(context, cloudFormation);

  const expiredStacks = stacks.filter(
    stack => isExpired(stack, config) && !stack.DeletionTime
  );

  if (expiredStacks.length === 0) {
    console.info(
      `No stacks found to delete of app: ${context.appConfig.appName}`
    );

    return;
  }

  if (!config.autoConfirm) {
    printStacksTable(context, expiredStacks);

    const {deleteConfirmation} = await prompts({
      type: 'confirm',
      name: 'deleteConfirmation',
      message: chalk.bold(
        chalk.red('The listed stacks will be deleted. Continue?')
      )
    });

    if (!deleteConfirmation) {
      return;
    }
  }

  const listrTasks: Listr.ListrTask[] = [];
  const s3 = new S3(clientConfig);

  for (const expiredStack of expiredStacks) {
    const stackName = context.parseStackName(expiredStack.StackName);

    listrTasks.push({
      title: `Deleting stack: ${stackName}`,
      task: async (_, listrTask) => {
        try {
          await deleteStack(
            context.deriveNewContext(stackName),
            cloudFormation,
            s3,
            expiredStack
          );

          listrTask.title = `Successfully deleted stack: ${stackName}`;
        } catch (error) {
          listrTask.title = `Error while deleting stack: ${stackName}`;

          throw error;
        }
      }
    });
  }

  await new Listr(listrTasks, {concurrent: true, exitOnError: false}).run();
}
