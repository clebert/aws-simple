import 'source-map-support/register';

import compression from 'compression';
import express from 'express';
import yargs from 'yargs';
import {isObject} from '../utils/is-object';
import {loadAppConfig} from '../utils/load-app-config';
import {resolveS3FileConfigs} from '../utils/resolve-s3-file-configs';
import {sortS3FileConfigs} from '../utils/sort-s3-file-configs';
import {serveLocalLambda} from './utils/serve-local-lambda';
import {serveLocalS3} from './utils/serve-local-s3';
import {suppressLambdaResultLogging} from './utils/suppress-lambda-result-logging';

interface Argv {
  readonly port: number;
  readonly cache?: boolean;
  readonly verbose?: boolean;
}

function isArgv(value: unknown): value is Argv {
  return isObject(value) && typeof value.port === 'number';
}

function startDevServer(argv: unknown): void {
  if (!isArgv(argv)) {
    throw new Error('Illegal arguments received.');
  }

  const {port, cache, verbose} = argv;

  const stackConfig = loadAppConfig().createStackConfig(port);

  const {
    minimumCompressionSizeInBytes,
    lambdaConfigs = [],
    s3Configs = [],
    enableCors,
  } = stackConfig;

  if (!verbose) {
    suppressLambdaResultLogging();
  }

  const app = express();

  app.use(express.text());

  if (typeof minimumCompressionSizeInBytes === 'number') {
    app.use(compression({threshold: minimumCompressionSizeInBytes}));
  }

  for (const lambdaConfig of lambdaConfigs) {
    serveLocalLambda(app, lambdaConfig, {useCache: cache});
  }

  const s3FileConfigs = sortS3FileConfigs(resolveS3FileConfigs(s3Configs));

  for (const s3FileConfig of s3FileConfigs) {
    serveLocalS3(app, s3FileConfig, {enableCors});
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
