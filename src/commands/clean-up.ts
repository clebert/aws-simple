import {Argv} from 'yargs';
import {Context} from '../context';
import {defaults} from '../defaults';
import {cleanUpStacks} from '../sdk/clean-up-stacks';
import {loadAppConfig} from '../utils/load-app-config';

export interface CleanUpArgv {
  readonly _: ['clean-up'];
  readonly config: string;
  readonly profile: string;
  readonly maxAge: number;
  readonly preserve?: string[];
  readonly yes: boolean;
}

export async function cleanUp(argv: CleanUpArgv): Promise<void> {
  const {config, profile, maxAge, preserve = [], yes} = argv;
  const context = new Context(loadAppConfig(config));

  await cleanUpStacks(context, profile, {
    maxAgeInDays: maxAge,
    tagNamesToPreserve: preserve,
    autoConfirm: yes
  });
}

cleanUp.describe = (yargs: Argv) =>
  yargs.command('clean-up [options]', 'Clean up old deployed stacks', args =>
    args
      .describe('config', 'The path to the config file')
      .string('config')
      .default('config', defaults.configFilename)

      .describe(
        'profile',
        'The AWS profile name as set in the shared credentials file'
      )
      .string('profile')
      .demandOption('profile')

      .describe(
        'max-age',
        'The maximum age (in days) of a stack, all older stacks will be deleted'
      )
      .number('max-age')
      .default('max-age', 30)

      .describe(
        'preserve',
        'Optional tag names that prevent a stack from being deleted regardless of its age'
      )
      .array('preserve')

      .describe(
        'yes',
        'The confirmation message will automatically be answered with Yes'
      )
      .boolean('yes')
      .default('yes', false)

      .example('$0 clean-up --profile clebert', '')

      .example(
        '$0 clean-up --profile clebert --max-age 14 --preserve released',
        ''
      )

      .example(
        '$0 clean-up --profile clebert --preserve released protected',
        ''
      )
  );

cleanUp.matches = (argv: {_: string[]}): argv is CleanUpArgv =>
  argv._[0] === 'clean-up';
