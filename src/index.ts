#!/usr/bin/env node

import yargs from 'yargs';
import {deleteCommand} from './delete-command';
import {listCommand} from './list-command';
import {purgeCommand} from './purge-command';
import type {StackConfig, readStackConfig} from './read-stack-config';
import {synthesizeCommand} from './synthesize-command';
import {tagCommand} from './tag-command';
import {uploadCommand} from './upload-command';
import {print} from './utils/print';

export type {StackConfig};
export type ConfigFileDefaultExport = typeof readStackConfig;

(async () => {
  const {description} = require(`../package.json`);

  const argv = yargs
    .usage(`Usage: $0 <command> [options]`)
    .help(`h`)
    .alias(`h`, `help`)
    .detectLocale(false)
    .demandCommand()
    .epilogue(description)
    .strict()
    .command(
      `${synthesizeCommand.commandName} [options]`,
      synthesizeCommand.description,
      synthesizeCommand.builder,
    )
    .command(
      `${uploadCommand.commandName} [options]`,
      uploadCommand.description,
      uploadCommand.builder,
    )
    .command(
      `${listCommand.commandName} [options]`,
      listCommand.description,
      listCommand.builder,
    )
    .command(
      `${deleteCommand.commandName} [options]`,
      deleteCommand.description,
      deleteCommand.builder,
    )
    .command(
      `${tagCommand.commandName} [options]`,
      tagCommand.description,
      tagCommand.builder,
    )
    .command(
      `${purgeCommand.commandName} [options]`,
      purgeCommand.description,
      purgeCommand.builder,
    ).argv as any;

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
  }
})().catch((error) => {
  print.error(String(error));
  process.exit(1);
});
