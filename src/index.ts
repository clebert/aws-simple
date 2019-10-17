#!/usr/bin/env node

import './init';

import chalk from 'chalk';
import compose from 'compose-function';
import yargs from 'yargs';
import {cleanUp} from './commands/clean-up';
import {create} from './commands/create';
import {list} from './commands/list';
import {start} from './commands/start';
import {tag} from './commands/tag';
import {upload} from './commands/upload';
import {loadAppConfig} from './utils/load-app-config';

(async () => {
  // tslint:disable-next-line: no-require-imports no-var-requires
  const {description} = require('../package.json');

  const argv = compose(
    cleanUp.describe,
    tag.describe,
    list.describe,
    start.describe,
    upload.describe,
    create.describe
  )(
    yargs
      .usage('Usage: $0 <command> [options]')
      .help('h')
      .alias('h', 'help')
      .detectLocale(false)
      .demandCommand()
      .epilogue(description)
  ).argv;

  const appConfig = loadAppConfig();

  create(appConfig, argv);

  await Promise.all([
    upload(appConfig, argv),
    start(appConfig, argv),
    list(appConfig, argv),
    tag(appConfig, argv),
    cleanUp(appConfig, argv)
  ]);
})().catch(error => {
  console.error(chalk.red(error.stack));

  process.exit(1);
});
