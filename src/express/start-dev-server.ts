import 'source-map-support/register';

import compression from 'compression';
import express from 'express';
import yargs from 'yargs';
import {loadAppConfig} from '../utils/load-app-config';
import {serveLocalLambda} from './utils/serve-local-lambda';
import {serveLocalS3} from './utils/serve-local-s3';
import {suppressLambdaResultLogging} from './utils/suppress-lambda-result-logging';

interface Argv {
  readonly port: number;
  readonly cache?: boolean;
  readonly verbose?: boolean;
}

// tslint:disable-next-line: no-any
function isArgv(value: any): value is Argv {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return typeof value.port === 'number';
}

function startDevServer(argv: unknown): void {
  if (!isArgv(argv)) {
    throw new Error('Illegal arguments received.');
  }

  const {port, cache, verbose} = argv;

  const {
    minimumCompressionSizeInBytes,
    lambdaConfigs = [],
    s3Configs = []
  } = loadAppConfig(port);

  if (!verbose) {
    suppressLambdaResultLogging();
  }

  const app = express();

  if (typeof minimumCompressionSizeInBytes === 'number') {
    app.use(compression({threshold: minimumCompressionSizeInBytes}));
  }

  for (const lambdaConfig of lambdaConfigs) {
    serveLocalLambda(app, lambdaConfig, Boolean(cache));
  }

  for (const s3Config of s3Configs) {
    serveLocalS3(app, s3Config);
  }

  app.listen(port, () => {
    console.info('Started DEV server:', `http://localhost:${port}`);
  });
}

startDevServer(
  yargs
    .detectLocale(false)
    .number('port')
    .demandOption('port')
    .boolean('cache')
    .boolean('verbose').argv
);
