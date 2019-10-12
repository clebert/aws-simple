import {fork} from 'child_process';
import {watch} from 'chokidar';
import getPort from 'get-port';
import * as path from 'path';
import {Argv} from 'yargs';
import {Context} from '../context';
import {defaults} from '../defaults';

export interface StartArgv {
  readonly _: ['start'];
  readonly config: string;
  readonly port: number;
  readonly cache: boolean;
  readonly verbose: boolean;
}

export async function start(argv: StartArgv): Promise<void> {
  const {config, port, cache, verbose} = argv;
  const {lambdaConfigs = [], s3Configs = []} = Context.load(config).appConfig;

  const localPaths = [...lambdaConfigs, ...s3Configs].map(
    ({localPath}) => localPath
  );

  const availablePort = await getPort({port});

  const startServer = () => {
    const args = ['--config', config, '--port', String(availablePort)];

    if (cache) {
      args.push('--cache');
    }

    if (verbose) {
      args.push('--verbose');
    }

    const modulePath = path.join(__dirname, '../express/start-server.js');

    return fork(modulePath, args, {stdio: 'inherit'});
  };

  let serverProcess = startServer();

  watch(localPaths).on('change', () => {
    console.info(new Date().toLocaleTimeString(), 'Restarting DEV server...');

    serverProcess.kill();

    serverProcess = startServer();
  });
}

start.describe = (yargs: Argv) =>
  yargs.command('start [options]', 'Start a local DEV server', args =>
    args
      .describe('config', 'The path to the config file')
      .string('config')
      .default('config', defaults.configFilename)

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
      .example('npx $0 start --port 3001 --cache', '')
  );

start.matches = (argv: {_: string[]}): argv is StartArgv =>
  argv._[0] === 'start';
