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
import {tagCommand} from './tag-command';
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
  let cli = yargs
    .usage(`Usage: $0 <command> [options]`)
    .help(`h`)
    .alias(`h`, `help`)
    .detectLocale(false)
    .demandCommand()
    .epilogue(require(`../package.json`).description)
    .strict();

  for (const {commandName, description, builder} of [
    synthesizeCommand,
    uploadCommand,
    listCommand,
    deleteCommand,
    tagCommand,
    purgeCommand,
    flushCacheCommand,
    redeployCommand,
    startCommand,
  ]) {
    cli = cli.command(`${commandName} [options]`, description, builder);
  }

  const argv = cli.argv as any;

  switch (argv._[0]) {
    case synthesizeCommand.commandName: {
      synthesizeCommand();
      break;
    }
    case uploadCommand.commandName: {
      await uploadCommand(argv);
      break;
    }
    case listCommand.commandName: {
      await listCommand(argv);
      break;
    }
    case deleteCommand.commandName: {
      await deleteCommand(argv);
      break;
    }
    case tagCommand.commandName: {
      await tagCommand(argv);
      break;
    }
    case purgeCommand.commandName: {
      await purgeCommand(argv);
      break;
    }
    case flushCacheCommand.commandName: {
      await flushCacheCommand(argv);
      break;
    }
    case redeployCommand.commandName: {
      await redeployCommand(argv);
      break;
    }
    case startCommand.commandName: {
      await startCommand(argv);
      break;
    }
  }
})().catch((error) => {
  print.error(String(error));
  process.exit(1);
});
