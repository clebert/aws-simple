import {Argv} from 'yargs';
import {Context} from '../context';
import {defaults} from '../defaults';
import {addTag} from '../sdk/add-tag';
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
  const context = new Context(loadAppConfig(config), stackName);

  await addTag(context, profile, tagName);
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
        'The stack name to be used instead of the default one declared in the config file'
      )
      .string('stack-name')

      .example('$0 tag --profile clebert --tag-name release', '')

      .example(
        '$0 tag --profile clebert --tag-name release --stack-name stage',
        ''
      )
  );

tag.matches = (argv: {_: string[]}): argv is TagArgv => argv._[0] === 'tag';
