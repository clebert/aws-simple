#!/usr/bin/env node

import chalk from 'chalk';
import yargs from 'yargs';
import {getStackConfig} from './get-stack-config';
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
    .command(
      `synthesize [options]`,
      `Synthesize a stack using the CDK`,
      (commandArgv) =>
        commandArgv.example(`npx cdk deploy --app 'npx $0 synthesize'`, ``),
    )
    .command(`upload [options]`, `Upload files to S3`, (commandArgv) =>
      commandArgv.example(`npx $0 upload`, ``),
    ).argv as unknown as {readonly _: readonly ['synthesize' | 'upload']};

  switch (argv._[0]) {
    case `synthesize`: {
      synthesize(getStackConfig());
      break;
    }
    case `upload`: {
      await upload(getStackConfig());
      break;
    }
  }
})().catch((error) => {
  console.error(chalk.red(String(error)));
  process.exit(1);
});
