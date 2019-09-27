import {Argv} from 'yargs';
import {defaults} from '../defaults';
import {createLambdaIntegration} from '../utils/cdk/create-lambda-integration';
import {createS3Integration} from '../utils/cdk/create-s3-integration';
import {createStack} from '../utils/cdk/create-stack';
import {DeploymentDescriptor} from '../utils/deployment-descriptor';
import {loadAppConfig} from '../utils/load-app-config';

export interface CreateArgv {
  readonly _: ['create'];
  readonly config: string;
  readonly stackName?: string;
}

export function describeCreateCommand(yargs: Argv): Argv {
  return yargs.command(
    'create [options]',
    'Create a stack using the CDK',
    args =>
      args
        .describe('config', 'The path to the config file')
        .string('config')
        .default('config', defaults.configFilename)

        .describe(
          'stack-name',
          'Optional overwriting of the stack name declared in the config file'
        )
        .string('stack-name')

        .example("cdk deploy --app '$0 create' --profile clebert", '')

        .example(
          "cdk deploy --app '$0 create --stack-name stage' --profile clebert",
          ''
        )
  );
}

export function isCreateArgv(argv: {_: string[]}): argv is CreateArgv {
  return argv._[0] === 'create';
}

export function create(argv: CreateArgv): void {
  const appConfig = loadAppConfig(argv.config, argv.stackName);
  const deployment = createStack(appConfig);
  const deploymentDescriptor = new DeploymentDescriptor(appConfig);
  const {stackConfig = {}} = appConfig;
  const {lambdaConfigs = [], s3Configs = [], customHook} = stackConfig;

  for (const lambdaConfig of lambdaConfigs) {
    createLambdaIntegration(deployment, deploymentDescriptor, lambdaConfig);
  }

  for (const s3Config of s3Configs) {
    createS3Integration(deployment, s3Config);
  }

  if (customHook) {
    customHook(deployment);
  }
}
