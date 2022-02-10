import type yargs from 'yargs';
import {readStackConfig} from './read-stack-config';
import {findStacks} from './sdk/find-stacks';
import {getFormattedAgeInDays} from './utils/get-formatted-age-in-days';
import {print} from './utils/print';

export interface ListCommandArgs {
  readonly all: boolean;
  readonly short: boolean;
  readonly legacyAppName: string | undefined;
}

const commandName = `list`;

const builder: yargs.BuilderCallback<{}, {}> = (argv) =>
  argv
    .describe(
      `all`,
      `List all deployed stacks without filtering by hosted zone name`,
    )
    .boolean(`all`)
    .default(`all`, false)

    .describe(`short`, `Give the output in an easy-to-parse format for scripts`)
    .boolean(`short`)
    .default(`short`, false)

    .describe(
      `legacy-app-name`,
      `An optional app name to identify legacy stacks`,
    )
    .string(`legacy-app-name`)

    .example(`npx $0 ${commandName}`, ``)
    .example(`npx $0 ${commandName} --all`, ``)
    .example(`npx $0 ${commandName} --short`, ``)
    .example(`npx $0 ${commandName} --legacy-app-name foo`, ``);

export async function listCommand(args: ListCommandArgs): Promise<void> {
  const {hostedZoneName} = readStackConfig();
  const {all, short, legacyAppName} = args;

  if (!short) {
    if (!all) {
      print.info(
        `Hosted zone name: ${hostedZoneName}`,
        legacyAppName && `Legacy app name: ${legacyAppName}`,
      );
    }

    print.info(`Searching stacks...`);
  }

  const stacks = all
    ? await findStacks()
    : await findStacks({hostedZoneName, legacyAppName});

  if (stacks.length === 0) {
    if (!short) {
      print.warning(`No matching stacks found.`);
    }

    return;
  }

  if (short) {
    for (const {StackName} of stacks) {
      print(StackName!);
    }

    return;
  }

  for (const stack of stacks) {
    print.listItem(0, {type: `headline`, text: `Stack`});
    print.listItem(1, {type: `entry`, key: `Name`, value: stack.StackName!});

    print.listItem(1, {
      type: `entry`,
      key: `Status`,
      value: stack.StackStatus!,
    });

    print.listItem(1, {
      type: `entry`,
      key: `Created`,
      value: getFormattedAgeInDays(stack.CreationTime!),
    });

    print.listItem(1, {
      type: `entry`,
      key: `Updated`,
      value: getFormattedAgeInDays(stack.LastUpdatedTime!),
    });

    if (stack.Tags && stack.Tags?.length > 0) {
      print.listItem(1, {type: `headline`, text: `Tags`});

      for (const {Key, Value} of stack.Tags) {
        print.listItem(2, {type: `entry`, key: Key!, value: Value!});
      }
    }
  }
}

listCommand.commandName = commandName;
listCommand.description = `List all deployed stacks filtered by the configured hosted zone name.`;
listCommand.builder = builder;
