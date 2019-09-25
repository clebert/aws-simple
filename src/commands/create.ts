import {Argv} from 'yargs';
import {Defaults} from '../defaults';
import {AppConfig} from '../utils/app-config';
import {createLambdaIntegration} from '../utils/create-lambda-integration';
import {createS3Integration} from '../utils/create-s3-integration';
import {createStack} from '../utils/create-stack';

export interface CreateArgv {
  readonly _: ['create'];
  readonly config: string;
}

export function describeCreateCommand(yargs: Argv): Argv {
  return yargs.command(
    'create [options]',
    'Create a stack using the CDK',
    args =>
      args
        .describe('config', 'The path to the config file')
        .string('config')
        .default('config', Defaults.configFilename)
  );
}

export function isCreateArgv(argv: {_: string[]}): argv is CreateArgv {
  return argv._[0] === 'create';
}

export function create(argv: CreateArgv): void {
  const appConfig = AppConfig.load(argv.config);
  const resources = createStack(appConfig);

  const {
    lambdaConfigs = [],
    s3Configs = [],
    customHook
  } = appConfig.stackConfig;

  for (const lambdaConfig of lambdaConfigs) {
    createLambdaIntegration(resources, appConfig, lambdaConfig);
  }

  for (const s3Config of s3Configs) {
    createS3Integration(resources, s3Config);
  }

  if (customHook) {
    customHook(resources);
  }
}
