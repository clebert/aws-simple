import {CloudFormation} from 'aws-sdk';
import chalk from 'chalk';
import createUi from 'cliui';
import Listr from 'listr';
import prompts from 'prompts';
import {Argv} from 'yargs';
import {deleteS3Bucket} from '../sdk/delete-s3-bucket';
import {deleteStack} from '../sdk/delete-stack';
import {findStacks} from '../sdk/find-stacks';
import {isStackExpired} from '../sdk/is-stack-expired';
import {AppConfig} from '../types';
import {getAgeInDays} from '../utils/get-age-in-days';
import {parseStackName} from '../utils/stack-name';

interface CleanUpArgv {
  readonly _: ['clean-up'];
  readonly minAge: number;
  readonly exclude: string[];
  readonly yes: boolean;
}

function isCleanUpArgv(argv: {readonly _: string[]}): argv is CleanUpArgv {
  return argv._[0] === 'clean-up';
}

function printStacksTable(stacks: CloudFormation.Stack[]): void {
  const ui = createUi({wrap: true});
  const padding: [number, number, number, number] = [0, 1, 0, 0];

  ui.div(
    {text: chalk.bold('App Version'), border: true, padding},
    {text: chalk.bold('Age'), border: true, padding, width: 11},
    {text: chalk.bold('Tags'), border: true}
  );

  for (const stack of stacks) {
    const {StackName, CreationTime, Tags} = stack;
    const parts = parseStackName(StackName);
    const age = getAgeInDays(CreationTime);

    ui.div(
      {text: parts ? parts.appVersion : StackName, padding},
      {text: `${age} day${age === 1 ? '' : 's'}`, padding, width: 11},
      Tags && Tags.length > 0 ? Tags.map(({Key}) => Key).join(', ') : ''
    );
  }

  console.info(ui.toString(), '\n');
}

export async function cleanUp(
  appConfig: AppConfig,
  clientConfig: CloudFormation.ClientConfiguration,
  argv: {readonly _: string[]}
): Promise<void> {
  if (!isCleanUpArgv(argv)) {
    return;
  }

  const stacks = await findStacks(appConfig, clientConfig);

  const expiredStacks = stacks.filter((stack) =>
    isStackExpired(stack, argv.minAge, argv.exclude)
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
      ),
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
      },
    });
  }

  await new Listr(listrTasks, {concurrent: true, exitOnError: false}).run();
}

cleanUp.describe = (argv: Argv) =>
  argv.command(
    'clean-up [options]',
    'Clean up old deployed stacks',
    (commandArgv) =>
      commandArgv
        .describe(
          'min-age',
          'The minimum age (in days) of a stack for deletion'
        )
        .number('min-age')
        .default('min-age', 30)

        .describe('exclude', 'Tags that exclude a stack from deletion')
        .array('exclude')
        .default('exclude', [])

        .describe(
          'yes',
          'The confirmation message will automatically be answered with yes'
        )
        .boolean('yes')
        .default('yes', false)

        .example('npx $0 clean-up', '')

        .example(
          'npx $0 clean-up --min-age 14 --exclude release prerelease --yes',
          ''
        )
  );
