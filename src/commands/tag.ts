import {Argv} from 'yargs';
import {defaults} from '../defaults';
import {addTag} from '../sdk/add-tag';
import {DeploymentDescriptor} from '../utils/deployment-descriptor';
import {loadAppConfig} from '../utils/load-app-config';

export interface TagArgv {
  readonly _: ['tag'];
  readonly config: string;
  readonly profile: string;
  readonly tagName: string;
  readonly stackName?: string;
}

export async function tag(argv: TagArgv): Promise<void> {
  const {config, profile, tagName, stackName} = argv;

  const deploymentDescriptor = new DeploymentDescriptor(
    loadAppConfig(config, stackName)
  );

  await addTag(deploymentDescriptor, profile, tagName);
}

tag.describe = (yargs: Argv) =>
  yargs.command('tag [options]', 'Tag a deployed stack', args =>
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

      .describe('tag-name', 'The tag name')
      .string('tag-name')
      .demandOption('tag-name')

      .describe(
        'stack-name',
        'Optional overwriting of the stack name declared in the config file'
      )
      .string('stack-name')

      .example('$0 tag --profile clebert --tag-name foo', '')
      .example('$0 tag --profile clebert --tag-name foo --stack-name stage', '')
  );

tag.matches = (argv: {_: string[]}): argv is TagArgv => argv._[0] === 'tag';
