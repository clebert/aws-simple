import {dirname} from 'path';
import type {APIGatewayProxyResult} from 'aws-lambda';
import {watch} from 'chokidar';
import compression from 'compression';
import express from 'express';
import getPort from 'get-port';
import * as lambdaLocal from 'lambda-local';
import mkdirp from 'mkdirp';
import type yargs from 'yargs';
import {createLambdaRequestHandler} from './dev/create-lambda-request-handler';
import {getRouterMatcher} from './dev/get-router-matcher';
import {registerS3Route} from './dev/register-s3-route';
import {removeAllRoutes} from './dev/remove-all-routes';
import {sortRoutes} from './dev/sort-routes';
import type {LambdaRoute} from './read-stack-config';
import {readStackConfig} from './read-stack-config';
import {print} from './utils/print';

export interface StartCommandArgs {
  readonly port: number;
}

const commandName = `start`;

const builder: yargs.BuilderCallback<{}, {}> = (argv) =>
  argv
    .describe(
      `port`,
      `The port to listen on if available, otherwise listen on a random port`,
    )
    .number(`port`)
    .default(`port`, 3000)

    .example(`npx $0 ${commandName}`, ``)
    .example(`npx $0 ${commandName} --port 3001`, ``);

export async function startCommand(args: StartCommandArgs): Promise<void> {
  const port = await getPort({port: args.port});
  const app = express();

  app.use(express.text());
  app.use(express.json());
  app.use(compression({threshold: 150}));

  const stackConfig = readStackConfig(port);
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
    print.success(`The DEV server has been started: http://localhost:${port}`);

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
}

startCommand.commandName = commandName;
startCommand.description = `Start a local DEV server.`;
startCommand.builder = builder;
