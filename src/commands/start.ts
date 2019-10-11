import {fork} from 'child_process';
import {watch} from 'chokidar';
import * as path from 'path';
import {Argv} from 'yargs';
import {Context} from '../context';
import {defaults} from '../defaults';

export interface StartArgv {
  readonly _: ['start'];
  readonly config: string;
  readonly port: number;
  readonly cached: boolean;
  readonly verbose: boolean;
}

export function start(argv: StartArgv): void {
  const {config, port, cached, verbose} = argv;
  const {lambdaConfigs = [], s3Configs = []} = Context.load(config).appConfig;

  const localPaths = [...lambdaConfigs, ...s3Configs].map(
    ({localPath}) => localPath
  );

  const startServer = () => {
    const args = ['--config', config, '--port', String(port)];

    if (cached) {
      args.push('--cached');
    }

    if (verbose) {
      args.push('--verbose');
    }

    const modulePath = path.join(__dirname, '../express/start-server.js');

    return fork(modulePath, args, {stdio: 'inherit'});
  };

  let serverProcess = startServer();

  watch(localPaths).on('change', () => {
    console.info(`Restarting DEV server...`);

    serverProcess.kill();

    serverProcess = startServer();
  });
}

start.describe = (yargs: Argv) =>
  yargs.command('start [options]', 'Start local DEV server', args =>
    args
      .describe('config', 'The path to the config file')
      .string('config')
      .default('config', defaults.configFilename)

      .describe('port', 'The port to listen on')
      .number('port')
      .default('port', 3000)

      .describe(
        'cached',
        'Enable caching of successful Lambda function results per request URL'
      )
      .boolean('cached')
      .default('cached', false)

      .describe(
        'verbose',
        'Enable logging of successful Lambda function results'
      )
      .boolean('verbose')
      .default('verbose', false)

      .example('npx $0 start', '')
      .example('npx $0 start --port 1985 --cached', '')
  );

start.matches = (argv: {_: string[]}): argv is StartArgv =>
  argv._[0] === 'start';
