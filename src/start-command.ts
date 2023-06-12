import type {CommandModule} from 'yargs';

import {registerLambdaRoute} from './dev/register-lambda-route.js';
import {registerS3Route} from './dev/register-s3-route.js';
import {sortRoutes} from './dev/sort-routes.js';
import {readStackConfig} from './read-stack-config.js';
import {print} from './utils/print.js';
import compression from 'compression';
import express from 'express';
import getPort from 'get-port';
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

    const stackConfig = await readStackConfig(port);

    stackConfig.onStart?.(app);

    const routes = sortRoutes(stackConfig.routes);

    for (const route of routes) {
      if (route.type === `function`) {
        registerLambdaRoute(app, route);
      } else {
        registerS3Route(app, route);
      }
    }

    const paths = routes.map(({path}) => path);

    app.listen(port, () => {
      print.success(
        `The DEV server has been started: http://localhost:${port}`,
      );

      for (const path of paths) {
        mkdirp.sync(dirname(path));
      }
    });
  },
};
