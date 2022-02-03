#!/usr/bin/env node

import chalk from 'chalk';
import yargs from 'yargs';
import {getStackConfig} from './get-stack-config';
import {synthesize} from './synthesize';

export type GetStackConfig = typeof getStackConfig;

// eslint-disable-next-line @typescript-eslint/require-await
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
    ).argv as {readonly _: readonly string[]};

  if (argv._[0] === `synthesize`) {
    synthesize(getStackConfig());
  }
})().catch((error) => {
  console.error(chalk.red(String(error)));
  process.exit(1);
});
