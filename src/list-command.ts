import type yargs from 'yargs';
import {readStackConfig} from './read-stack-config';
import {findStacks} from './sdk/find-stacks';
import {getFormattedAgeInDays} from './utils/get-formatted-age-in-days';
import {print} from './utils/print';

export interface ListCommandArgs {
  readonly any: boolean;
  readonly legacyAppName: string | undefined;
}

const commandName = `list`;

const builder: yargs.BuilderCallback<{}, {}> = (argv) =>
  argv
    .describe(
      `any`,
      `List any deployed stacks without filtering by hosted zone name`,
    )
    .boolean(`any`)
    .default(`any`, false)

    .describe(
      `legacy-app-name`,
      `An additional app name to identify legacy stacks`,
    )
    .string(`legacy-app-name`)

    .example(`npx $0 ${commandName}`, ``)
    .example(`npx $0 ${commandName} --any`, ``)
    .example(`npx $0 ${commandName} --legacy-app-name foo`, ``);

export async function listCommand(args: ListCommandArgs): Promise<void> {
  const {hostedZoneName} = readStackConfig();
  const {any, legacyAppName} = args;

  if (!any) {
    print.info(
      `Hosted zone name: ${hostedZoneName}`,
      legacyAppName && `Legacy app name: ${legacyAppName}`,
    );
  }

  print.info(`Searching stacks...`);

  const stacks = any
    ? await findStacks()
    : await findStacks({hostedZoneName, legacyAppName});

  if (stacks.length === 0) {
    print.warning(`No matching stacks found.`);
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
listCommand.description = `List all deployed stacks associated with the configured hosted zone name.`;
listCommand.builder = builder;
