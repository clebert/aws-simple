import type yargs from 'yargs';
import {
  formatDate,
  formatEntry,
  formatHeadline,
  formatSubheadline,
  printInfo,
  printList,
  printWarning,
} from './cli';
import {readStackConfig} from './read-stack-config';
import {findStacks} from './sdk/find-stacks';

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

    .describe(`legacy-app-name`, `The app name to identify legacy stacks`)
    .string(`legacy-app-name`)

    .example(`npx $0 ${commandName}`, ``)
    .example(`npx $0 ${commandName} --any`, ``)
    .example(`npx $0 ${commandName} --legacy-app-name foo`, ``);

export async function listCommand(args: ListCommandArgs): Promise<void> {
  const {hostedZoneName} = readStackConfig();
  const {any, legacyAppName} = args;

  if (!any) {
    printInfo(
      `Hosted zone name: ${hostedZoneName}`,
      legacyAppName && `Legacy app name: ${legacyAppName}`,
    );
  }

  printInfo(`Searching stacks...`);

  const stacks = any
    ? await findStacks()
    : await findStacks({hostedZoneName, legacyAppName});

  if (stacks.length === 0) {
    printWarning(`No matching stacks found.`);
    return;
  }

  for (const stack of stacks) {
    printList(0, formatHeadline(`Stack`));
    printList(1, formatEntry(`Name`, stack.StackName!));
    printList(1, formatEntry(`Status`, stack.StackStatus!));
    printList(1, formatEntry(`Created`, formatDate(stack.CreationTime!)));
    printList(1, formatEntry(`Updated`, formatDate(stack.LastUpdatedTime!)));

    if (stack.Tags && stack.Tags?.length > 0) {
      printList(1, formatSubheadline(`Tags`));

      for (const {Key, Value} of stack.Tags) {
        printList(2, formatEntry(Key!, Value!));
      }
    }
  }
}

listCommand.commandName = commandName;
listCommand.description = `List all deployed stacks associated with the configured hosted zone name.`;
listCommand.builder = builder;
