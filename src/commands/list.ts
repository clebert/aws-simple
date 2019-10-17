import {Argv} from 'yargs';
import {createClientConfig} from '../sdk/create-client-config';
import {findStacks} from '../sdk/find-stacks';
import {printStacksTable} from '../sdk/print-stacks-table';
import {AppConfig} from '../types';

interface ListArgv {
  readonly _: ['list'];
}

function isListArgv(argv: {readonly _: string[]}): argv is ListArgv {
  return argv._[0] === 'list';
}

export async function list(
  appConfig: AppConfig,
  argv: {readonly _: string[]}
): Promise<void> {
  if (!isListArgv(argv)) {
    return;
  }

  const clientConfig = await createClientConfig();
  const stacks = await findStacks(appConfig, clientConfig);

  if (stacks.length === 0) {
    console.info('No stacks found.');
  } else {
    printStacksTable(stacks);
  }
}

list.describe = (argv: Argv) =>
  argv.command('list [options]', 'List all deployed stacks', commandArgv =>
    commandArgv.example('npx $0 list', '')
  );
