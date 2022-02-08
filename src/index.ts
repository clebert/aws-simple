#!/usr/bin/env node

import yargs from 'yargs';
import {Cli} from './cli';
import {getStackConfig} from './get-stack-config';
import {list} from './list';
import {synthesize} from './synthesize';
import {upload} from './upload';

export type GetStackConfig = typeof getStackConfig;

const buildSynthesizeCommand: yargs.BuilderCallback<{}, {}> = (argv) =>
  argv.example(`npx cdk deploy --app 'npx $0 synthesize'`, ``);

const buildUploadCommand: yargs.BuilderCallback<{}, {}> = (argv) =>
  argv
    .describe(`yes`, `Automatically confirm the upload`)
    .boolean(`yes`)
    .default(`yes`, false)

    .example(`npx $0 upload`, ``)
    .example(`npx $0 upload --yes`, ``);

const buildListCommand: yargs.BuilderCallback<{}, {}> = (argv) =>
  argv
    .describe(
      `all`,
      `List all stacks no matter which domain name they belong to`,
    )
    .boolean(`all`)
    .default(`all`, false)

    .describe(
      `hosted-zone-name`,
      `List the stacks that belong to the specified hosted zone name, ` +
        `if none is specified, the hosted zone name is read from the config file`,
    )
    .string(`hosted-zone-name`)

    .describe(
      `legacy-app-name`,
      `List the stacks that belong to the specified app name`,
    )
    .string(`legacy-app-name`)

    .example(`npx $0 list`, ``)
    .example(`npx $0 list --all`, ``)
    .example(`npx $0 list --domain-name=example.com`, ``)
    .example(`npx $0 list --legacy-app-name=example`, ``);

const cli = new Cli();

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
      buildSynthesizeCommand,
    )
    .command(`upload [options]`, `Upload files to S3`, buildUploadCommand)
    .command(`list [options]`, `List deployed stacks`, buildListCommand)
    .argv as any;

  switch (argv._[0]) {
    case `synthesize`: {
      synthesize(getStackConfig());
      break;
    }
    case `upload`: {
      await upload(cli, getStackConfig(), argv);
      break;
    }
    case `list`: {
      await list(cli, getStackConfig(), argv);
      break;
    }
  }
})().catch((error) => {
  cli.paragraph(String(error), {messageType: `error`});
  process.exit(1);
});
