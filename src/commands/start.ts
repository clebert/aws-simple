import type {Argv} from 'yargs';
import {startDevServer} from '../express/start-dev-server';
import type {AppConfig} from '../types';

interface StartArgv {
  readonly _: ['start'];
  readonly port: number;
  readonly cache: boolean;
  readonly verbose: boolean;
}

function isStartArgv(argv: {readonly _: unknown[]}): argv is StartArgv {
  return argv._[0] === 'start';
}

export async function start(
  appConfig: AppConfig,
  argv: {readonly _: unknown[]}
): Promise<boolean> {
  if (!isStartArgv(argv)) {
    return false;
  }

  const {port: requestedPort, cache: useCache, verbose} = argv;

  await startDevServer({appConfig, requestedPort, useCache, verbose});

  return true;
}

start.describe = (argv: Argv) =>
  argv.command('start [options]', 'Start a local DEV server', (commandArgv) =>
    commandArgv
      .describe(
        'port',
        'The port to listen on if available, otherwise listen on a random port'
      )
      .number('port')
      .default('port', 3000)

      .describe(
        'cache',
        'Enable caching of successful caching-enabled Lambda function results per request URL'
      )
      .boolean('cache')
      .default('cache', false)

      .describe(
        'verbose',
        'Enable logging of successful Lambda function results'
      )
      .boolean('verbose')
      .default('verbose', false)

      .example('npx $0 start', '')
      .example('npx $0 start --port 3001 --cache --verbose', '')
  );
