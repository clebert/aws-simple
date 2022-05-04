import {dirname} from 'path';
import type {APIGatewayProxyResult} from 'aws-lambda';
import {watch} from 'chokidar';
import compression from 'compression';
import express from 'express';
import getPort from 'get-port';
import * as lambdaLocal from 'lambda-local';
import mkdirp from 'mkdirp';
import type {CommandModule} from 'yargs';
import {createLambdaRequestHandler} from './dev/create-lambda-request-handler.js';
import {getRouterMatcher} from './dev/get-router-matcher.js';
import {registerS3Route} from './dev/register-s3-route.js';
import {removeAllRoutes} from './dev/remove-all-routes.js';
import {sortRoutes} from './dev/sort-routes.js';
import type {LambdaRoute} from './stack-config.js';
import {print} from './utils/print.js';
import {readStackConfig} from './utils/read-stack-config.js';

const commandName = `start`;

export const startCommand: CommandModule<{}, {readonly port: number}> = {
  command: `${commandName} [options]`,
  describe: `Start a local DEV server.`,

  builder: (argv) =>
    argv
      .options(`port`, {
        describe: `The port to listen on if available, otherwise listen on a random port`,
        number: true,
        default: 3000,
      })
      .example([
        [`npx $0 ${commandName}`],
        [`npx $0 ${commandName} --port 3001`],
      ]),

  handler: async (args): Promise<void> => {
    const port = await getPort({port: args.port});
    const app = express();

    app.use(express.text());
    app.use(express.json());
    app.use(compression({threshold: 150}));
    app.set(`etag`, false);

    const stackConfig = await readStackConfig(port);
    const routes = sortRoutes(stackConfig.routes);

    const lambdaCaches = new WeakMap<
      LambdaRoute,
      Map<string, APIGatewayProxyResult>
    >();

    lambdaLocal.getLogger().level = `error`;

    for (const route of routes) {
      if (route.type === `function`) {
        const {cacheTtlInSeconds = 300} = route;

        if (stackConfig.cachingEnabled && cacheTtlInSeconds > 0) {
          print.info(
            `Setting up cache for Lambda request handler: ${route.functionName}`,
          );

          lambdaCaches.set(route, new Map());
        }

        getRouterMatcher(app, route.httpMethod)(
          route.publicPath,
          createLambdaRequestHandler(route, lambdaCaches.get(route)),
        );
      } else {
        registerS3Route(app, route);
      }
    }

    const paths = routes.map(({path}) => path);

    app.listen(port, () => {
      print.success(
        `The DEV server has been started: http://localhost:${port}`,
      );

      const listener = (changedPath: string): void => {
        print.info(
          `[${new Date().toLocaleTimeString()}] A file change has been detected: ${changedPath}`,
        );

        const changedLambdaRoutes = routes.filter(
          (route): route is LambdaRoute =>
            route.type === `function` && route.path === changedPath,
        );

        for (const route of changedLambdaRoutes) {
          const {cacheTtlInSeconds = 300} = route;

          if (stackConfig.cachingEnabled && cacheTtlInSeconds > 0) {
            print.info(
              `Flushing cache for Lambda request handler: ${route.functionName}`,
            );

            lambdaCaches.set(route, new Map());
          }
        }

        removeAllRoutes(app);

        for (const route of routes) {
          if (route.type === `function`) {
            getRouterMatcher(app, route.httpMethod)(
              route.publicPath,
              createLambdaRequestHandler(route, lambdaCaches.get(route)),
            );
          } else {
            registerS3Route(app, route);
          }
        }
      };

      for (const path of paths) {
        mkdirp.sync(dirname(path));
      }

      watch(paths, {ignoreInitial: true}).on(`add`, listener);
      watch(paths).on(`change`, listener);
    });
  },
};
