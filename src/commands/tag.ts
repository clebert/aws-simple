import {Argv} from 'yargs';
import {defaults} from '../defaults';
import {addTag} from '../sdk/add-tag';
import {DeploymentDescriptor} from '../utils/deployment-descriptor';
import {loadAppConfig} from '../utils/load-app-config';

export interface TagArgv {
  readonly _: ['tag'];
  readonly config: string;
  readonly profile: string;
  readonly region: string;
  readonly tagName: string;
  readonly stackName?: string;
}

export function describeTagCommand(yargs: Argv): Argv {
  return yargs.command('tag [options]', 'Tag a deployed stack', args =>
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

      .describe('tag-name', 'The tag name')
      .string('tag-name')
      .demandOption('tag-name')

      .describe(
        'stack-name',
        'Optional overwriting of the stack name declared in the config file'
      )
      .string('stack-name')

      .example(
        '$0 tag --profile clebert --region eu-central-1 --tag-name foo',
        ''
      )

      .example(
        '$0 tag --profile clebert --region eu-central-1 --tag-name foo --stack-name stage',
        ''
      )
  );
}

export function isTagArgv(argv: {_: string[]}): argv is TagArgv {
  return argv._[0] === 'tag';
}

export async function tag(argv: TagArgv): Promise<void> {
  const {config, profile, region, tagName, stackName} = argv;

  const deploymentDescriptor = new DeploymentDescriptor(
    loadAppConfig(config, stackName)
  );

  await addTag(deploymentDescriptor, {profile, region}, tagName);
}
