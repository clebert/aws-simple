import {Argv} from 'yargs';
import {createLambdaIntegration} from '../cdk/create-lambda-integration';
import {createResources} from '../cdk/create-resources';
import {createS3Integration} from '../cdk/create-s3-integration';
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
): boolean {
  if (!isCreateArgv(argv)) {
    return false;
  }

  const resources = createResources(appConfig);
  const {lambdaConfigs = [], s3Configs = []} = appConfig;

  for (const lambdaConfig of lambdaConfigs) {
    createLambdaIntegration(resources, lambdaConfig);
  }

  for (const s3Config of s3Configs) {
    createS3Integration(resources, s3Config);
  }

  return true;
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
