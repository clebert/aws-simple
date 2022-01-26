import path from 'path';
import type {APIGatewayProxyResult} from 'aws-lambda';
import {watch} from 'chokidar';
import compression from 'compression';
import express from 'express';
import getPort from 'get-port';
import mkdirp from 'mkdirp';
import type {AppConfig, LambdaConfig} from '../types';
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

function splitLambdaConfigs(lambdaConfigs: LambdaConfig[]): LambdaConfig[] {
  const allLambdaConfigs: LambdaConfig[] = [];

  for (const {publicPath, catchAll, ...lambdaConfig} of lambdaConfigs) {
    allLambdaConfigs.push({...lambdaConfig, publicPath});

    if (catchAll) {
      allLambdaConfigs.push({
        ...lambdaConfig,
        publicPath:
          publicPath + (publicPath.endsWith(`/`) ? `{proxy+}` : `/{proxy+}`),
      });
    }
  }

  return allLambdaConfigs;
}

export async function startDevServer(init: DevServerInit): Promise<void> {
  const {appConfig, requestedPort, useCache, verbose} = init;

  if (!verbose) {
    suppressLambdaResultLogging();
  }

  const app = express();

  app.use(express.text());
  app.use(express.json());

  const port = await getPort({port: requestedPort});
  const stackConfig = appConfig.createStackConfig(port);

  const {
    minimumCompressionSizeInBytes,
    s3Configs = [],
    enableCors = false,
  } = stackConfig;

  if (typeof minimumCompressionSizeInBytes === `number`) {
    app.use(compression({threshold: minimumCompressionSizeInBytes}));
  }

  const lambdaCaches = useCache
    ? new WeakMap<LambdaConfig, Map<string, APIGatewayProxyResult>>()
    : undefined;

  const lambdaConfigs = splitLambdaConfigs(stackConfig.lambdaConfigs ?? []);
  const routeConfigs = [...lambdaConfigs, ...s3Configs];

  for (const routeConfig of sortRouteConfigs(routeConfigs)) {
    if (`httpMethod` in routeConfig) {
      if (lambdaCaches && routeConfig.cachingEnabled) {
        lambdaCaches.set(routeConfig, new Map());

        logInfo(
          `Initialized DEV server cache for Lambda: ${routeConfig.publicPath} -> ${routeConfig.localPath}`,
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
      const changedLambdaConfigs = lambdaConfigs.filter(
        ({localPath, devServer, publicPath}) =>
          localPath === changedLocalPath ||
          devServer?.localPathDependencies?.some((localPathDependency) => {
            if (localPathDependency === changedLocalPath) {
              logInfo(
                `Changed local DEV path dependency detected for Lambda: ${publicPath} depends on ${localPathDependency}`,
              );

              return true;
            }

            return false;
          }),
      );

      for (const changedLambdaConfig of changedLambdaConfigs) {
        if (lambdaCaches && changedLambdaConfig?.cachingEnabled) {
          lambdaCaches.set(changedLambdaConfig, new Map());

          logInfo(
            `Invalidated DEV server cache for Lambda: ${changedLambdaConfig.publicPath} -> ${changedLambdaConfig.localPath}`,
          );
        }
      }

      removeAllRoutes(app);

      for (const routeConfig of sortRouteConfigs(routeConfigs)) {
        if (`httpMethod` in routeConfig) {
          registerLambdaRoute(app, routeConfig, lambdaCaches?.get(routeConfig));
        } else {
          registerS3Route(app, routeConfig, enableCors);
        }
      }

      logInfo(
        `Reregistered DEV server routes because of changed ${
          changedLambdaConfigs.length ? `Lambda` : `S3`
        } file: ${changedLocalPath}`,
      );
    };

    const localPaths = routeConfigs.map(({localPath}) => localPath);

    for (const localPath of localPaths) {
      mkdirp.sync(path.dirname(localPath));
    }

    watch(localPaths, {ignoreInitial: true}).on(`add`, handleLocalPathChanges);
    watch(localPaths).on(`change`, handleLocalPathChanges);
  });
}
