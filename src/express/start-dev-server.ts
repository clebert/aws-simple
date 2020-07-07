import {APIGatewayProxyResult} from 'aws-lambda';
import {watch} from 'chokidar';
import compression from 'compression';
import express from 'express';
import getPort from 'get-port';
import mkdirp from 'mkdirp';
import path from 'path';
import {AppConfig, LambdaConfig} from '../types';
import {logInfo} from './utils/log-info';
import {registerLambdaRoute} from './utils/register-lambda-route';
import {registerS3Route} from './utils/register-s3-route';
import {removeAllRoutes} from './utils/remove-all-routes';
import {sortRouteConfigs} from './utils/sort-route-configs';
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
    enableCors = false,
  } = stackConfig;

  if (typeof minimumCompressionSizeInBytes === 'number') {
    app.use(compression({threshold: minimumCompressionSizeInBytes}));
  }

  const lambdaCaches = useCache
    ? new WeakMap<LambdaConfig, Map<string, APIGatewayProxyResult>>()
    : undefined;

  for (const routeConfig of sortRouteConfigs([
    ...lambdaConfigs,
    ...s3Configs,
  ])) {
    if ('httpMethod' in routeConfig) {
      if (lambdaCaches && routeConfig.cachingEnabled) {
        lambdaCaches.set(routeConfig, new Map());

        logInfo(
          `Initialized DEV server cache for Lambda: ${routeConfig.localPath}`
        );
      }

      registerLambdaRoute(app, routeConfig, lambdaCaches?.get(routeConfig));
    } else {
      registerS3Route(app, routeConfig, enableCors);
    }
  }

  app.listen(port, () => {
    logInfo(`Started DEV server: http://localhost:${port}`);

    const handleLocalPathChanges = (changedLocalPath: string) => {
      const changedLambdaConfig = lambdaConfigs.find(
        ({localPath}) => localPath === changedLocalPath
      );

      if (lambdaCaches && changedLambdaConfig?.cachingEnabled) {
        lambdaCaches.set(changedLambdaConfig, new Map());

        logInfo(
          `Invalidated DEV server cache for Lambda: ${changedLambdaConfig.localPath}`
        );
      }

      removeAllRoutes(app);

      for (const routeConfig of sortRouteConfigs([
        ...lambdaConfigs,
        ...s3Configs,
      ])) {
        if ('httpMethod' in routeConfig) {
          registerLambdaRoute(app, routeConfig, lambdaCaches?.get(routeConfig));
        } else {
          registerS3Route(app, routeConfig, enableCors);
        }
      }

      logInfo(
        `Reregistered DEV server routes because of changed ${
          changedLambdaConfig ? 'Lambda' : 'S3'
        } file: ${changedLocalPath}`
      );
    };

    const localPaths = [...lambdaConfigs, ...s3Configs].map(
      ({localPath}) => localPath
    );

    for (const localPath of localPaths) {
      mkdirp.sync(path.dirname(localPath));
    }

    watch(localPaths, {ignoreInitial: true}).on('add', handleLocalPathChanges);
    watch(localPaths).on('change', handleLocalPathChanges);
  });
}
