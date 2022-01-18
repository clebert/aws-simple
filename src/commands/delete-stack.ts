import type {CloudFormation} from 'aws-sdk';
import chalk from 'chalk';
import Listr from 'listr';
import pRetry from 'p-retry';
import prompts from 'prompts';
import type {Argv} from 'yargs';
import {deleteS3Bucket} from '../sdk/delete-s3-bucket';
import {deleteStack as deleteCloudFormationStack} from '../sdk/delete-stack';
import {findStackOutput} from '../sdk/find-stack-output';
import {findStacks} from '../sdk/find-stacks';
import type {AppConfig} from '../types';
import {isObject} from '../utils/is-object';
import { createStackName } from '../utils/stack-name';

interface DeleteStackArgv {
  readonly _: ['delete-stack'];
  readonly yes: boolean;
}

function isDeleteStackArgv(argv: {
  readonly _: unknown[];
}): argv is DeleteStackArgv {
  return argv._[0] === `delete-stack`;
}

export async function deleteStack(
  appConfig: AppConfig,
  clientConfig: CloudFormation.ClientConfiguration,
  argv: {readonly _: unknown[]},
): Promise<void> {
  if (!isDeleteStackArgv(argv)) {
    return;
  }

  const stackName = createStackName(appConfig);
  const stacks = await findStacks(appConfig, clientConfig);
  const stackToDelete = stacks.find((stack) => stack.StackName === stackName);

  if (!stackToDelete) {
    console.info(`No stack found with name ${stackName}.`);

    return;
  }

  if (!argv.yes) {
    console.info(`Found stack ${stackToDelete.StackName} with status: ${stackToDelete.StackStatus}`);

    const {deleteConfirmation} = await prompts({
      type: `confirm`,
      name: `deleteConfirmation`,
      message: chalk.bold(
        chalk.red(`The stack ${stackToDelete.StackName} will be deleted. Continue?`),
      ),
    });

    if (!deleteConfirmation) {
      return;
    }
  }

  const listrTasks: Listr.ListrTask[] = [];

  listrTasks.push({
    title: `Deleting stack ${stackToDelete.StackName} and associated S3 bucket`,
    task: () =>
      new Listr(
        [
          {
            title: `Deleting stack`,
            task: async (_, listrSubTask) =>
              pRetry(
                async () =>
                  deleteCloudFormationStack(clientConfig, stackToDelete),
                {
                  retries: 10,
                  onFailedAttempt: ({attemptNumber, retriesLeft}) => {
                    listrSubTask.title = `Attempt ${attemptNumber} to delete the stack failed. There are ${retriesLeft} retries left.`;
                  },
                },
              ),
          },
          {
            title: `Deleting S3 bucket`,
            task: async (_, listrSubTask) => {
              let s3BucketName: string;

              try {
                s3BucketName = findStackOutput(stackToDelete, `S3BucketName`);
              } catch (error) {
                listrSubTask.skip(
                  error instanceof Error ? error.message : `No bucket name.`,
                );

                return;
              }

              try {
                await deleteS3Bucket(clientConfig, s3BucketName);
              } catch (error) {
                if (isObject(error) && error.code === `NoSuchBucket`) {
                  listrSubTask.skip(
                    error instanceof Error ? error.message : `No such bucket.`,
                  );
                } else {
                  throw error;
                }
              }
            },
          },
        ],
        {exitOnError: true},
      ),
  });

  await new Listr(listrTasks, {concurrent: true, exitOnError: false}).run();
}

deleteStack.describe = (argv: Argv) =>
  argv.command(`delete-stack [options]`, `Deletes the stack and remove all attached AWS resources`, (commandArgv) =>
    commandArgv
      .describe(
        `yes`,
        `The confirmation message will automatically be answered with yes`,
      )
      .boolean(`yes`)
      .default(`yes`, false)

      .example(`npx $0 delete-stack --yes`, ``),
  );
