#!/usr/bin/env node

import './init';

import chalk from 'chalk';
import compose from 'compose-function';
import {render} from 'ink';
import React from 'react';
import signalExit from 'signal-exit';
import yargs from 'yargs';
import {cleanUp} from './commands/clean-up';
import {create} from './commands/create';
import {start} from './commands/start';
import {upload} from './commands/upload';
import {ListCommand} from './components/list-command';
import {RedeployCommand} from './components/redeploy-command';
import {TagCommand} from './components/tag-command';
import {Ui} from './components/ui';
import {createClientConfig} from './sdk/create-client-config';
import {loadAppConfig} from './utils/load-app-config';

(async () => {
  const {description} = require('../package.json');

  const argv = compose(
    RedeployCommand.describe,
    cleanUp.describe,
    TagCommand.describe,
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

  if (await start(appConfig, argv)) {
    return;
  }

  const clientConfig = await createClientConfig();

  // New UI
  const exitPromise = render(
    <Ui appConfig={appConfig} clientConfig={clientConfig} argv={argv} />
  ).waitUntilExit();

  create(appConfig, argv);

  // Legacy UI
  await upload(appConfig, clientConfig, argv);
  await cleanUp(appConfig, clientConfig, argv);

  await exitPromise;
})().catch((error) => {
  signalExit(() => {
    /*
     * This ensures that the error is printed after ink has finished rendering.
     * Otherwise ink renders the same output twice.
     */
    console.error(chalk.red(String(error.stack)));
  });

  process.exit(1);
});
