import {Argv} from 'yargs';
import {defaults} from '../defaults';
import {listAllStacks} from '../sdk/list-all-stacks';
import {DeploymentDescriptor} from '../utils/deployment-descriptor';
import {loadAppConfig} from '../utils/load-app-config';

export interface ListArgv {
  readonly _: ['upload'];
  readonly config: string;
  readonly profile: string;
  readonly region: string;
}

export function describeListCommand(yargs: Argv): Argv {
  return yargs.command('list [options]', 'List all deployed stacks', args =>
    args
      .describe('config', 'The path to the config file')
      .string('config')
      .default('config', defaults.configFilename)

      .describe(
        'profile',
        'The AWS profile name as set in the shared credentials file'
      )
      .string('profile')
      .demandOption('profile')

      .describe('region', 'The AWS region')
      .string('region')
      .demandOption('region')

      .example('$0 list --profile clebert --region eu-central-1', '')
  );
}

export function isListArgv(argv: {_: string[]}): argv is ListArgv {
  return argv._[0] === 'list';
}

export async function list(argv: ListArgv): Promise<void> {
  const {config, profile, region} = argv;
  const deploymentDescriptor = new DeploymentDescriptor(loadAppConfig(config));

  await listAllStacks(deploymentDescriptor, {profile, region});
}
