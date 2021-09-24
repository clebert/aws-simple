import {CloudFormation} from 'aws-sdk';
import Listr from 'listr';
import {Argv} from 'yargs';
import {findStack} from '../sdk/find-stack';
import {flushApiGatewayCache} from '../sdk/flush-api-gateway-cache';
import {AppConfig} from '../types';

interface FlushCacheArgv {
  readonly _: ['flush-cache'];
}

function isFlushCacheArgv(argv: {
  readonly _: unknown[];
}): argv is FlushCacheArgv {
  return argv._[0] === 'flush-cache';
}

export async function flushCache(
  appConfig: AppConfig,
  clientConfig: CloudFormation.ClientConfiguration,
  argv: {readonly _: unknown[]}
): Promise<void> {
  if (!isFlushCacheArgv(argv)) {
    return;
  }

  const listr = new Listr([
    {
      title: 'Flushing API Gateway Cache',
      task: async (_, listrTask) => {
        try {
          const stack = await findStack(appConfig, clientConfig);

          await flushApiGatewayCache(clientConfig, stack);

          listrTask.title = 'Successfully flushed API Gateway Cache';
        } catch (error) {
          listrTask.title = 'Error while flushing API Gateway Cache';

          throw error;
        }
      },
    },
  ]);

  await listr.run();
}

flushCache.describe = (argv: Argv) =>
  argv.command(
    'flush-cache [options]',
    'Flush the cache of the API Gateway',
    (commandArgv) => commandArgv.example('npx $0 flush-cache', '')
  );
