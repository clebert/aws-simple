import {Argv} from 'yargs';
import {Context} from '../context';
import {defaults} from '../defaults';
import {updateTags} from '../sdk/update-tags';

export interface TagArgv {
  readonly _: ['tag'];
  readonly config: string;
  readonly add?: string[];
  readonly remove?: string[];
  readonly stackName?: string;
}

export async function tag(argv: TagArgv): Promise<void> {
  const {config, add = [], remove = [], stackName} = argv;

  await updateTags(Context.load(config, stackName), add, remove);
}

tag.describe = (yargs: Argv) =>
  yargs.command('tag [options]', 'Tag a deployed stack', args =>
    args
      .describe('config', 'The path to the config file')
      .string('config')
      .default('config', defaults.configFilename)

      .describe('add', 'The tags to add')
      .array('add')

      .describe('remove', 'The tags to remove')
      .array('remove')

      .describe(
        'stack-name',
        'The stack name to be used instead of the default one declared in the config file'
      )
      .string('stack-name')

      .example('npx $0 tag --add release --remove prerelease', '')
      .example('npx $0 tag --add release --stack-name stage', '')
  );

tag.matches = (argv: {_: string[]}): argv is TagArgv => argv._[0] === 'tag';
