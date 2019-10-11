import {Argv} from 'yargs';
import {Context} from '../context';
import {defaults} from '../defaults';
import {listAllStacks} from '../sdk/list-all-stacks';

export interface ListArgv {
  readonly _: ['list'];
  readonly config: string;
}

export async function list(argv: ListArgv): Promise<void> {
  await listAllStacks(Context.load(argv.config));
}

list.describe = (yargs: Argv) =>
  yargs.command('list [options]', 'List all deployed stacks', args =>
    args
      .describe('config', 'The path to the config file')
      .string('config')
      .default('config', defaults.configFilename)

      .example('npx $0 list', '')
  );

list.matches = (argv: {_: string[]}): argv is ListArgv => argv._[0] === 'list';
