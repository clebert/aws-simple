import {Argv} from 'yargs';
import {createLambdaIntegration} from '../cdk/create-lambda-integration';
import {createResources} from '../cdk/create-resources';
import {createS3Integration} from '../cdk/create-s3-integration';
import {Context} from '../context';
import {defaults} from '../defaults';

export interface CreateArgv {
  readonly _: ['create'];
  readonly config: string;
  readonly stackName?: string;
}

export function create(argv: CreateArgv): void {
  const {config, stackName} = argv;
  const context = Context.load(config, {stackName});
  const resources = createResources(context);
  const {lambdaConfigs = [], s3Configs = []} = context.appConfig;

  for (const lambdaConfig of lambdaConfigs) {
    createLambdaIntegration(context, resources, lambdaConfig);
  }

  for (const s3Config of s3Configs) {
    createS3Integration(resources, s3Config);
  }
}

create.describe = (yargs: Argv) =>
  yargs.command('create [options]', 'Create a stack using the CDK', args =>
    args
      .describe('config', 'The path to the config file')
      .string('config')
      .default('config', defaults.configFilename)

      .describe(
        'stack-name',
        'The stack name to be used instead of the default one declared in the config file'
      )
      .string('stack-name')

      .example("npx cdk deploy --app 'npx $0 create'", '')
      .example("npx cdk deploy --app 'npx $0 create --stack-name stage'", '')
  );

create.matches = (argv: {_: string[]}): argv is CreateArgv =>
  argv._[0] === 'create';
