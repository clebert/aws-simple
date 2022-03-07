#!/usr/bin/env node

import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {deleteCommand} from './delete-command.js';
import {flushCacheCommand} from './flush-cache-command.js';
import {listCommand} from './list-command.js';
import {purgeCommand} from './purge-command.js';
import type {
  Authentication,
  LambdaRequestParameter,
  LambdaRoute,
  Monitoring,
  Route,
  RouteOptions,
  S3Route,
  StackConfig,
  Throttling,
} from './read-stack-config.js';
import {redeployCommand} from './redeploy-command.js';
import {startCommand} from './start-command.js';
import {synthesizeCommand} from './synthesize-command.js';
import {uploadCommand} from './upload-command.js';
import {print} from './utils/print.js';

export type {
  Authentication,
  LambdaRequestParameter,
  LambdaRoute,
  Monitoring,
  Route,
  RouteOptions,
  S3Route,
  StackConfig,
  Throttling,
};

export type ConfigFileDefaultExport = (port?: number) => StackConfig;

(async () => {
  await yargs(hideBin(process.argv))
    .usage(`Usage: $0 <command> [options]`)
    .help(`h`)
    .alias(`h`, `help`)
    .epilogue(
      `Production-ready AWS website deployment with minimal configuration.`,
    )
    .detectLocale(false)
    .demandCommand()
    .command(synthesizeCommand)
    .command(uploadCommand)
    .command(listCommand)
    .command(deleteCommand)
    .command(purgeCommand)
    .command(flushCacheCommand)
    .command(redeployCommand)
    .command(startCommand)
    .strict()
    .fail(false)
    .parseAsync();
})().catch((error) => {
  print.error(String(error));
  process.exit(1);
});
