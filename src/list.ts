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

export interface ListArgs {
  readonly all: boolean;
  readonly legacyAppName: string | undefined;
}

const command: yargs.BuilderCallback<{}, {}> = (argv) =>
  argv
    .describe(`all`, `List all stacks without filtering by hosted zone name`)
    .boolean(`all`)
    .default(`all`, false)

    .describe(`legacy-app-name`, `The app name to identify legacy stacks`)
    .string(`legacy-app-name`)

    .example(`npx $0 list`, ``)
    .example(`npx $0 list --all`, ``)
    .example(`npx $0 list --legacy-app-name foo`, ``);

export async function list(args: ListArgs): Promise<void> {
  const {hostedZoneName} = readStackConfig();
  const {all, legacyAppName} = args;

  if (all) {
    printInfo(`No filters set.`);
  } else {
    printInfo(
      `Filter by hosted zone name: ${hostedZoneName}`,
      legacyAppName && `or filter by legacy app name: ${legacyAppName}`,
    );
  }

  printInfo(`The listing process is running...`);

  const stacks = all
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

list.command = command;
