#!/usr/bin/env node

import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {cleanupCommand} from './cleanup-command.js';
import {deleteCommand} from './delete-command.js';
import {flushCacheCommand} from './flush-cache-command.js';
import {listCommand} from './list-command.js';
import {purgeCommand} from './purge-command.js';
import type {
  LambdaRoute,
  Route,
  S3Route,
  StackConfig,
} from './read-stack-config.js';
import {redeployCommand} from './redeploy-command.js';
import {startCommand} from './start-command.js';
import {synthesizeCommand} from './synthesize-command.js';
import {tagCommand} from './tag-command.js';
import {uploadCommand} from './upload-command.js';
import {print} from './utils/print.js';

export type {LambdaRoute, Route, S3Route, StackConfig};
export type ConfigFileDefaultExport = (port?: number) => StackConfig;

(async () => {
  const argv = yargs(hideBin(process.argv));

  await argv
    .usage(`Usage: $0 <command> [options]`)
    .help(`h`)
    .alias(`h`, `help`)
    .epilogue(
      `Production-ready AWS website deployment with minimal configuration.`,
    )
    .detectLocale(false)
    .wrap(null)
    .demandCommand()
    .command(synthesizeCommand)
    .command(uploadCommand)
    .command(listCommand)
    .command(tagCommand)
    .command(deleteCommand)
    .command(purgeCommand)
    .command(flushCacheCommand)
    .command(redeployCommand)
    .command(cleanupCommand)
    .command(startCommand)
    .strict()
    .fail(false)
    .parseAsync();
})().catch((error) => {
  print.error(String(error));
  process.exit(1);
});
