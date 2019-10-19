import {Argv} from 'yargs';
import {createStack} from '../cdk/create-stack';
import {AppConfig} from '../types';

interface CreateArgv {
  readonly _: ['create'];
}

function isCreateArgv(argv: {readonly _: string[]}): argv is CreateArgv {
  return argv._[0] === 'create';
}

export function create(
  appConfig: AppConfig,
  argv: {readonly _: string[]}
): void {
  if (isCreateArgv(argv)) {
    createStack(appConfig);
  }
}

create.describe = (argv: Argv) =>
  argv.command(
    'create [options]',
    'Create a stack using the CDK',
    commandArgv =>
      commandArgv
        .example('npx $0 create', '')
        .example("npx cdk deploy --app 'npx $0 create'", '')
  );
