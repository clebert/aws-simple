import compression from 'compression';
import express from 'express';
import lambdaLocal from 'lambda-local';
import {format} from 'winston';
import {StackConfig} from '..';
import {serveLocalLambda} from './serve-local-lambda';
import {serveLocalS3} from './serve-local-s3';

export interface ServerConfig {
  readonly port: number;
  readonly cached: boolean;
  readonly verbose: boolean;
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

export function startServer(
  stackConfig: StackConfig,
  serverConfig: ServerConfig
): void {
  const {
    minimumCompressionSize,
    lambdaConfigs = [],
    s3Configs = []
  } = stackConfig;

  const {port, cached, verbose} = serverConfig;

  if (!verbose) {
    suppressLambdaResultLogging();
  }

  const app = express();

  if (typeof minimumCompressionSize === 'number') {
    app.use(compression({threshold: minimumCompressionSize}));
  }

  for (const lambdaConfig of lambdaConfigs) {
    serveLocalLambda(app, lambdaConfig, cached);
  }

  for (const s3Config of s3Configs) {
    serveLocalS3(app, s3Config);
  }

  app.listen(port, () => {
    console.info(`Started DEV server: http://localhost:${port}`);
  });
}
