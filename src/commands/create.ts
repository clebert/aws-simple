import {Argv} from 'yargs';
import {Defaults} from '../constants/defaults';
import {createLambdaIntegration} from '../utils/create-lambda-integration';
import {createS3Integration} from '../utils/create-s3-integration';
import {createStack} from '../utils/create-stack';
import {loadStackConfig} from '../utils/load-stack-config';

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
  const stackConfig = loadStackConfig(argv.config);
  const {stackId, lambdaConfigs = [], s3Configs = [], customHook} = stackConfig;
  const resources = createStack(stackConfig);

  for (const lambdaConfig of lambdaConfigs) {
    createLambdaIntegration(stackId, resources, lambdaConfig);
  }

  for (const s3Config of s3Configs) {
    createS3Integration(resources, s3Config);
  }

  if (customHook) {
    customHook(resources);
  }
}
