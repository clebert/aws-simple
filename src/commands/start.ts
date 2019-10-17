import {fork} from 'child_process';
import {watch} from 'chokidar';
import getPort from 'get-port';
import * as path from 'path';
import {Argv} from 'yargs';
import {AppConfig} from '../types';

interface StartArgv {
  readonly _: ['start'];
  readonly port: number;
  readonly cache: boolean;
  readonly verbose: boolean;
}

function isStartArgv(argv: {readonly _: string[]}): argv is StartArgv {
  return argv._[0] === 'start';
}

export async function start(
  appConfig: AppConfig,
  argv: {readonly _: string[]}
): Promise<void> {
  if (!isStartArgv(argv)) {
    return;
  }

  const {lambdaConfigs = [], s3Configs = []} = appConfig;

  const localPaths = [...lambdaConfigs, ...s3Configs].map(
    ({localPath}) => localPath
  );

  const port = await getPort({port: argv.port});

  const startDevServer = () => {
    const args = ['--port', String(port)];

    if (argv.cache) {
      args.push('--cache');
    }

    if (argv.verbose) {
      args.push('--verbose');
    }

    const modulePath = path.join(__dirname, '../express/start-dev-server.js');

    return fork(modulePath, args, {stdio: 'inherit'});
  };

  let serverProcess = startDevServer();

  watch(localPaths).on('change', () => {
    console.info(new Date().toLocaleTimeString(), 'Restarting DEV server...');

    serverProcess.kill();

    serverProcess = startDevServer();
  });
}

start.describe = (argv: Argv) =>
  argv.command('start [options]', 'Start a local DEV server', commandArgv =>
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
