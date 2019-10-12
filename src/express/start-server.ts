import 'source-map-support/register';

import compression from 'compression';
import express from 'express';
import lambdaLocal from 'lambda-local';
import {format} from 'winston';
import yargs from 'yargs';
import {Context} from '../context';
import {serveLocalLambda} from './serve-local-lambda';
import {serveLocalS3} from './serve-local-s3';

interface Argv {
  readonly config: string;
  readonly port: number;
  readonly cache?: boolean;
  readonly verbose?: boolean;
}

// tslint:disable-next-line: no-any
function isArgv(value: any): value is Argv {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return typeof value.config === 'string' && typeof value.port === 'number';
}

function suppressLambdaResultLogging(): void {
  const logger = lambdaLocal.getLogger();

  logger.format = format.combine(
    format(info => {
      if ('statusCode' in info && 'headers' in info && 'body' in info) {
        return false;
      }

      return info;
    })(),
    logger.format
  );
}

function startServer(argv: unknown): void {
  if (!isArgv(argv)) {
    throw new Error('Illegal arguments received.');
  }

  const {config, port, cache, verbose} = argv;

  const {
    minimumCompressionSizeInBytes,
    lambdaConfigs = [],
    s3Configs = []
  } = Context.load(config).appConfig;

  if (!verbose) {
    suppressLambdaResultLogging();
  }

  const app = express();

  if (typeof minimumCompressionSizeInBytes === 'number') {
    app.use(compression({threshold: minimumCompressionSizeInBytes}));
  }

  for (const lambdaConfig of lambdaConfigs) {
    serveLocalLambda(app, port, lambdaConfig, Boolean(cache));
  }

  for (const s3Config of s3Configs) {
    serveLocalS3(app, s3Config);
  }

  app.listen(port, () => {
    console.info('Started DEV server:', `http://localhost:${port}`);
  });
}

startServer(
  yargs
    .detectLocale(false)
    .string('config')
    .demandOption('config')
    .number('port')
    .demandOption('port')
    .boolean('cache')
    .boolean('verbose').argv
);
