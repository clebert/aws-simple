import {Argv} from 'yargs';
import {Defaults} from '../defaults';
import {AppConfig} from '../utils/app-config';
import {startServer} from '../utils/start-server';

export interface StartArgv {
  readonly _: ['start'];
  readonly config: string;
  readonly port: number;
  readonly cached: boolean;
  readonly verbose: boolean;
}

export function describeStartCommand(yargs: Argv): Argv {
  return yargs.command('start [options]', 'Start local DEV server', args =>
    args
      .describe('config', 'The path to the config file')
      .string('config')
      .default('config', Defaults.configFilename)

      .describe('port', 'The port to listen on')
      .number('port')
      .default('port', 3000)

      .describe(
        'cached',
        'Enable caching of successful Lambda results per request URL'
      )
      .boolean('cached')
      .default('cached', false)

      .describe('verbose', 'Enable logging of successful Lambda results')
      .boolean('verbose')
      .default('verbose', false)
  );
}

export function isStartArgv(argv: {_: string[]}): argv is StartArgv {
  return argv._[0] === 'start';
}

export function start(argv: StartArgv): void {
  const {config, port, cached, verbose} = argv;

  startServer(AppConfig.load(config), {port, cached, verbose});
}
