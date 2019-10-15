import chalk from 'chalk';
import Listr from 'listr';
import prompts from 'prompts';
import {Argv} from 'yargs';
import {createClientConfig} from '../sdk/create-client-config';
import {deleteS3Bucket} from '../sdk/delete-s3-bucket';
import {deleteStack} from '../sdk/delete-stack';
import {findStacks} from '../sdk/find-stacks';
import {isStackExpired} from '../sdk/is-stack-expired';
import {printStacksTable} from '../sdk/print-stacks-table';
import {AppConfig} from '../types';

interface CleanUpArgv {
  readonly _: ['clean-up'];
  readonly maxAge: number;
  readonly preserve: string[];
  readonly yes: boolean;
}

function isCleanUpArgv(argv: {readonly _: string[]}): argv is CleanUpArgv {
  return argv._[0] === 'clean-up';
}

export async function cleanUp(
  appConfig: AppConfig,
  argv: {readonly _: string[]}
): Promise<void> {
  if (!isCleanUpArgv(argv)) {
    return;
  }

  const clientConfig = await createClientConfig();
  const stacks = await findStacks(appConfig, clientConfig);

  const expiredStacks = stacks.filter(stack =>
    isStackExpired(
      {maxAgeInDays: argv.maxAge, tagsToPreserve: argv.preserve},
      stack
    )
  );

  if (expiredStacks.length === 0) {
    console.info('No stacks found to delete.');

    return;
  }

  if (!argv.yes) {
    printStacksTable(expiredStacks);

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

  for (const expiredStack of expiredStacks) {
    const {StackName: stackName} = expiredStack;

    listrTasks.push({
      title: `Deleting stack: ${stackName}`,
      task: async (_, listrTask) => {
        try {
          await deleteStack(clientConfig, expiredStack);
          await deleteS3Bucket(clientConfig, expiredStack);

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

cleanUp.describe = (argv: Argv) =>
  argv.command(
    'clean-up [options]',
    'Clean up old deployed stacks',
    commandArgv =>
      commandArgv
        .describe(
          'max-age',
          'The maximum age (in days) of a stack, all older stacks will be deleted'
        )
        .number('max-age')
        .default('max-age', 30)

        .describe(
          'preserve',
          'Tags that prevent a stack from being deleted regardless of its age'
        )
        .array('preserve')
        .default('preserve', [])

        .describe(
          'yes',
          'The confirmation message will automatically be answered with yes'
        )
        .boolean('yes')
        .default('yes', false)

        .example('npx $0 clean-up', '')

        .example(
          'npx $0 clean-up --max-age 14 --preserve release prerelease --yes',
          ''
        )
  );
