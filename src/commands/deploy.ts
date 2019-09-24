import {Argv} from 'yargs';
import {Defaults} from '../constants/defaults';
import {deployLambdaIntegration} from '../utils/deploy-lambda-integration';
import {deployS3Integration} from '../utils/deploy-s3-integration';
import {deployStack} from '../utils/deploy-stack';
import {loadStackConfig} from '../utils/load-stack-config';

export interface DeployArgv {
  readonly _: ['deploy'];
  readonly config: string;
}

export function describeDeployCommand(yargs: Argv): Argv {
  return yargs.command(
    'deploy [options]',
    'Deploy stack with CloudFormation',
    args =>
      args
        .describe('config', 'The path to the config file')
        .string('config')
        .default('config', Defaults.configFilename)
  );
}

export function isDeployArgv(argv: {_: string[]}): argv is DeployArgv {
  return argv._[0] === 'deploy';
}

export function deploy(argv: DeployArgv): void {
  const stackConfig = loadStackConfig(argv.config);

  const {
    stackId,
    lambdaConfigs = [],
    s3Configs = [],
    deploymentHook
  } = stackConfig;

  const resources = deployStack(stackConfig);

  for (const lambdaConfig of lambdaConfigs) {
    deployLambdaIntegration(stackId, resources, lambdaConfig);
  }

  for (const s3Config of s3Configs) {
    deployS3Integration(resources, s3Config);
  }

  if (deploymentHook) {
    deploymentHook(resources);
  }
}
