import {Argv} from 'yargs';
import {Context} from '../context';
import {defaults} from '../defaults';
import {listAllStacks} from '../sdk/list-all-stacks';
import {loadAppConfig} from '../utils/load-app-config';

export interface ListArgv {
  readonly _: ['list'];
  readonly config: string;
  readonly profile: string;
}

export async function list(argv: ListArgv): Promise<void> {
  const {config, profile} = argv;
  const context = new Context(loadAppConfig(config));

  await listAllStacks(context, profile);
}

list.describe = (yargs: Argv) =>
  yargs.command('list [options]', 'List all deployed stacks', args =>
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

      .example('$0 list --profile clebert', '')
  );

list.matches = (argv: {_: string[]}): argv is ListArgv => argv._[0] === 'list';
