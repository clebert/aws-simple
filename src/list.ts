import {
  formatDate,
  formatEntry,
  formatHeadline,
  formatSubheadline,
  printList,
  printSuccess,
  printWarning,
} from './cli';
import type {StackConfig} from './get-stack-config';
import {findStacks} from './sdk/find-stacks';

export interface ListArgs {
  readonly all: boolean;
  readonly hostedZoneName: string | undefined;
  readonly legacyAppName: string | undefined;
}

export async function list(
  stackConfig: StackConfig,
  args: ListArgs,
): Promise<void> {
  const {all, legacyAppName} = args;
  const hostedZoneName = args.hostedZoneName || stackConfig.hostedZoneName;

  if (all) {
    printSuccess(`No filters set.`);
  } else {
    printWarning(
      `Filter by hosted zone name: ${hostedZoneName}`,
      legacyAppName && `or filter by legacy app name: ${legacyAppName}`,
    );
  }

  const stacks = await findStacks(all ? {} : {hostedZoneName, legacyAppName});

  if (stacks.length === 0) {
    printWarning(`No matching stacks found.`);
    return;
  }

  for (const stack of stacks) {
    printList(0, formatHeadline(`Stack`));
    printList(1, formatEntry(`Name`, stack.StackName!));
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
