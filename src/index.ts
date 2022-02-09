#!/usr/bin/env node

import yargs from 'yargs';
import {printError} from './cli';
import {delete_} from './delete';
import type {getStackConfig} from './get-stack-config';
import {list} from './list';
import {synthesize} from './synthesize';
import {upload} from './upload';

export type GetStackConfig = typeof getStackConfig;

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
    .command(`synthesize [options]`, `Synthesize a stack`, synthesize.command)
    .command(`upload [options]`, `Upload files to S3`, upload.command)
    .command(`list [options]`, `List stacks`, list.command)
    .command(`delete [options]`, `Delete a stack`, delete_.command).argv as any;

  switch (argv._[0]) {
    case `synthesize`: {
      synthesize();
      break;
    }
    case `upload`: {
      await upload(argv);
      break;
    }
    case `list`: {
      await list(argv);
      break;
    }
    case `delete`: {
      await delete_(argv);
      break;
    }
  }
})().catch((error) => {
  printError(String(error));
  process.exit(1);
});
