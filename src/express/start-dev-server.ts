import {watch} from 'chokidar';
import compression from 'compression';
import express from 'express';
import getPort from 'get-port';
import {AppConfig} from '../types';
import {registerRoutes} from './utils/register-routes';
import {removeAllRoutes} from './utils/remove-all-routes';
import {suppressLambdaResultLogging} from './utils/suppress-lambda-result-logging';

export interface DevServerInit {
  readonly appConfig: AppConfig;
  readonly requestedPort: number;
  readonly useCache: boolean;
  readonly verbose: boolean;
}

export async function startDevServer(init: DevServerInit): Promise<void> {
  const {appConfig, requestedPort, useCache, verbose} = init;

  if (!verbose) {
    suppressLambdaResultLogging();
  }

  const app = express();

  app.use(express.text());

  const port = await getPort({port: requestedPort});
  const stackConfig = appConfig.createStackConfig(port);

  const {
    minimumCompressionSizeInBytes,
    lambdaConfigs = [],
    s3Configs = [],
  } = stackConfig;

  if (typeof minimumCompressionSizeInBytes === 'number') {
    app.use(compression({threshold: minimumCompressionSizeInBytes}));
  }

  registerRoutes(app, stackConfig, useCache);

  app.listen(port, () => {
    console.info(
      `[${new Date().toLocaleTimeString()}] Started DEV server: http://localhost:${port}`
    );

    const localPaths = [...lambdaConfigs, ...s3Configs].map(
      ({localPath}) => localPath
    );

    watch(localPaths).on('change', () => {
      console.info(
        `[${new Date().toLocaleTimeString()}] Reregister DEV server routes...`
      );

      removeAllRoutes(app);
      registerRoutes(app, stackConfig, useCache);
    });
  });
}
