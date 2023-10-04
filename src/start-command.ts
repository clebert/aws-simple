import type {LambdaRoute} from './parse-stack-config.js';
import type {APIGatewayProxyResult} from 'aws-lambda';
import type {CommandModule} from 'yargs';

import {createLambdaRequestHandler} from './dev/create-lambda-request-handler.js';
import {getRouterMatcher} from './dev/get-router-matcher.js';
import {registerS3Route} from './dev/register-s3-route.js';
import {removeAllRoutes} from './dev/remove-all-routes.js';
import {sortRoutes} from './dev/sort-routes.js';
import {parseStackConfig} from './parse-stack-config.js';
import {readStackConfig} from './read-stack-config.js';
import {print} from './utils/print.js';
import {watch} from 'chokidar';
import compression from 'compression';
import express from 'express';
import getPort from 'get-port';
import * as lambdaLocal from 'lambda-local';
import {mkdirp} from 'mkdirp';
import {dirname} from 'path';

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

    app.use(express.text({type: `*/*`}));
    app.use(compression({threshold: 150}));
    app.set(`etag`, false);

    const stackConfig = parseStackConfig(await readStackConfig(port));

    stackConfig.onStart?.(app);

    const lambdaCaches = new WeakMap<
      LambdaRoute,
      Map<string, APIGatewayProxyResult>
    >();

    lambdaLocal.getLogger().level = `error`;

    const routes = sortRoutes(stackConfig.routes);

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
