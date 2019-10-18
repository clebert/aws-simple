#!/usr/bin/env node

import './init';

import chalk from 'chalk';
import compose from 'compose-function';
import {render} from 'ink';
import React from 'react';
import yargs from 'yargs';
import {cleanUp} from './commands/clean-up';
import {create} from './commands/create';
import {start} from './commands/start';
import {tag} from './commands/tag';
import {upload} from './commands/upload';
import {ListCommand} from './components/list-command';
import {Ui} from './components/ui';
import {createClientConfig} from './sdk/create-client-config';
import {loadAppConfig} from './utils/load-app-config';

(async () => {
  // tslint:disable-next-line: no-require-imports no-var-requires
  const {description} = require('../package.json');

  const argv = compose(
    cleanUp.describe,
    tag.describe,
    ListCommand.describe,
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
      .strict()
  ).argv;

  const appConfig = loadAppConfig();

  if (create(appConfig, argv)) {
    return;
  }

  const clientConfig = await createClientConfig();

  // Legacy UI
  await Promise.all([
    upload(appConfig, clientConfig, argv),
    start(appConfig, argv),
    tag(appConfig, clientConfig, argv),
    cleanUp(appConfig, clientConfig, argv)
  ]);

  // New UI
  await render(
    <Ui appConfig={appConfig} clientConfig={clientConfig} argv={argv} />,
    {experimental: true}
  ).waitUntilExit();
})().catch(error => {
  console.error(chalk.red(String(error.stack)));

  process.exit(1);
});
