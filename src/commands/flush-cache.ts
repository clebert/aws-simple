import type {CloudFormation} from 'aws-sdk';
import Listr from 'listr';
import type {Argv} from 'yargs';
import {findStack} from '../sdk/find-stack';
import {flushRestApiCache} from '../sdk/flush-rest-api-cache';
import type {AppConfig} from '../types';

interface FlushCacheArgv {
  readonly _: ['flush-cache'];
}

function isFlushCacheArgv(argv: {
  readonly _: unknown[];
}): argv is FlushCacheArgv {
  return argv._[0] === `flush-cache`;
}

export async function flushCache(
  appConfig: AppConfig,
  clientConfig: CloudFormation.ClientConfiguration,
  argv: {readonly _: unknown[]},
): Promise<void> {
  if (!isFlushCacheArgv(argv)) {
    return;
  }

  const listr = new Listr([
    {
      title: `Flushing REST API cache`,
      task: async (_, listrTask) => {
        try {
          const stack = await findStack(appConfig, clientConfig);

          await flushRestApiCache(clientConfig, stack);

          listrTask.title = `Successfully flushed REST API cache`;
        } catch (error) {
          listrTask.title = `Error while flushing REST API cache`;

          throw error;
        }
      },
    },
  ]);

  await listr.run();
}

flushCache.describe = (argv: Argv) =>
  argv.command(
    `flush-cache [options]`,
    `Flush the cache of the REST API`,
    (commandArgv) => commandArgv.example(`npx $0 flush-cache`, ``),
  );
