import {Argv} from 'yargs';
import {Context} from '../context';
import {defaults} from '../defaults';
import {listAllStacks} from '../sdk/list-all-stacks';

export interface ListArgv {
  readonly _: ['list'];
  readonly config: string;
  readonly profile?: string;
}

export async function list(argv: ListArgv): Promise<void> {
  const {config, profile} = argv;

  await listAllStacks(Context.load(config, {profile}));
}

list.describe = (yargs: Argv) =>
  yargs.command('list [options]', 'List all deployed stacks', args =>
    args
      .describe('config', 'The path to the config file')
      .string('config')
      .default('config', defaults.configFilename)

      .describe(
        'profile',
        'An AWS profile name as set in the shared credentials file'
      )
      .string('profile')

      .example('npx $0 list', '')
  );

list.matches = (argv: {_: string[]}): argv is ListArgv => argv._[0] === 'list';
