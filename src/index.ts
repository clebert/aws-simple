#!/usr/bin/env node

import yargs from 'yargs';
import {deleteCommand} from './delete-command';
import {flushCacheCommand} from './flush-cache-command';
import {listCommand} from './list-command';
import {purgeCommand} from './purge-command';
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
  readStackConfig,
} from './read-stack-config';
import {redeployCommand} from './redeploy-command';
import {startCommand} from './start-command';
import {synthesizeCommand} from './synthesize-command';
import {uploadCommand} from './upload-command';
import {print} from './utils/print';

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

export type ConfigFileDefaultExport = typeof readStackConfig;

(async () => {
  await yargs
    .usage(`Usage: $0 <command> [options]`)
    .help(`h`)
    .alias(`h`, `help`)
    .epilogue(require(`../package.json`).description)
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
