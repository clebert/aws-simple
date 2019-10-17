import Listr from 'listr';
import {Argv} from 'yargs';
import {createClientConfig} from '../sdk/create-client-config';
import {findStack} from '../sdk/find-stack';
import {updateStackTags} from '../sdk/update-stack-tags';
import {AppConfig} from '../types';

interface TagArgv {
  readonly _: ['tag'];
  readonly add: string[];
  readonly remove: string[];
}

function isTagArgv(argv: {readonly _: string[]}): argv is TagArgv {
  return argv._[0] === 'tag';
}

export async function tag(
  appConfig: AppConfig,
  argv: {readonly _: string[]}
): Promise<void> {
  if (!isTagArgv(argv)) {
    return;
  }

  const clientConfig = await createClientConfig();
  const stack = await findStack(appConfig, clientConfig);

  await new Listr([
    {
      title: 'Completing stack update',
      task: async (_, listrTask) => {
        try {
          await updateStackTags(clientConfig, stack, argv.add, argv.remove);

          listrTask.title = 'Successfully completed stack update';
        } catch (error) {
          listrTask.title = 'Error while completing stack update';

          throw error;
        }
      }
    }
  ]).run();
}

tag.describe = (argv: Argv) =>
  argv.command('tag [options]', 'Tag a deployed stack', commandArgv =>
    commandArgv
      .describe('add', 'The tags to add')
      .array('add')
      .default('add', [])

      .describe('remove', 'The tags to remove')
      .array('remove')
      .default('remove', [])

      .example('npx $0 tag --add latest release --remove prerelease', '')
  );
