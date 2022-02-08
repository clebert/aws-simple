#!/usr/bin/env node

import chalk from 'chalk';
import yargs from 'yargs';
import {getStackConfig} from './get-stack-config';
import {list} from './list';
import {findStacks} from './sdk/find-stacks';
import {synthesize} from './synthesize';
import {upload} from './upload';

export type GetStackConfig = typeof getStackConfig;

(async () => {
  const {description} = require(`../package.json`);

  const cli = yargs
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
    )

    .command(`list [options]`, `List deployed stacks`, (commandArgv) =>
      commandArgv
        .describe(
          `all`,
          `List all deployed stacks no matter which domain name they belong to`,
        )
        .boolean(`all`)
        .default(`all`, false)

        .describe(
          `domain-name`,
          `List the deployed stacks that belong to the specified domain name, ` +
            `if none is specified, the domain name is read from the config file`,
        )
        .string(`domain-name`)

        .describe(
          `legacy-app-name`,
          `List the deployed stacks that belong to the specified app name`,
        )
        .string(`legacy-app-name`)

        .example(`npx $0 list`, ``)
        .example(`npx $0 list --all`, ``)
        .example(`npx $0 list --domain-name=example.com`, ``)
        .example(`npx $0 list --legacy-app-name=example`, ``),
    );

  const argv = cli.argv as any;

  switch (argv._[0]) {
    case `synthesize`: {
      synthesize(getStackConfig());
      break;
    }
    case `upload`: {
      await upload(getStackConfig());
      break;
    }
    case `list`: {
      const {all, domainName, legacyAppName} = argv;

      list(
        await findStacks(
          all
            ? {}
            : {
                domainName: domainName || getStackConfig().domainName,
                legacyAppName,
              },
        ),
      );

      break;
    }
  }
})().catch((error) => {
  console.error(chalk.red(String(error)));
  process.exit(1);
});
