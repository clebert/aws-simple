import {Argv} from 'yargs';
import {Context} from '../context';
import {defaults} from '../defaults';
import {addTag} from '../sdk/add-tag';

export interface TagArgv {
  readonly _: ['tag'];
  readonly config: string;
  readonly tagName: string;
  readonly profile?: string;
  readonly stackName?: string;
}

export async function tag(argv: TagArgv): Promise<void> {
  const {config, profile, tagName, stackName} = argv;

  await addTag(Context.load(config, {profile, stackName}), tagName);
}

tag.describe = (yargs: Argv) =>
  yargs.command('tag [options]', 'Tag a deployed stack', args =>
    args
      .describe('config', 'The path to the config file')
      .string('config')
      .default('config', defaults.configFilename)

      .describe('tag-name', 'The tag name')
      .string('tag-name')
      .demandOption('tag-name')

      .describe(
        'profile',
        'An AWS profile name as set in the shared credentials file'
      )
      .string('profile')

      .describe(
        'stack-name',
        'The stack name to be used instead of the default one declared in the config file'
      )
      .string('stack-name')

      .example('npx $0 tag --tag-name release', '')
      .example('npx $0 tag --tag-name release --stack-name stage', '')
  );

tag.matches = (argv: {_: string[]}): argv is TagArgv => argv._[0] === 'tag';
