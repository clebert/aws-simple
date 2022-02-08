import * as CLI from './cli';
import type {StackConfig} from './get-stack-config';
import {findStacks} from './sdk/find-stacks';
import {getAgeInDays} from './utils/get-age-in-days';

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
    CLI.success(`No filters set.`);
  } else {
    CLI.warning(
      `Filter by hosted zone name: ${hostedZoneName}`,
      legacyAppName && `or filter by legacy app name: ${legacyAppName}`,
    );
  }

  const stacks = await findStacks(all ? {} : {hostedZoneName, legacyAppName});

  if (stacks.length === 0) {
    CLI.warning(`No matching stacks found.`);
    return;
  }

  for (const stack of stacks) {
    CLI.listItem(0, CLI.headline(`Stack`));
    CLI.listItem(1, CLI.entry(`Name`, stack.StackName!));
    CLI.listItem(1, CLI.entry(`Created`, formatDate(stack.CreationTime!)));
    CLI.listItem(1, CLI.entry(`Updated`, formatDate(stack.LastUpdatedTime!)));

    if (stack.Tags && stack.Tags?.length > 0) {
      CLI.listItem(1, CLI.subheadline(`Tags`));

      for (const {Key, Value} of stack.Tags) {
        CLI.listItem(2, CLI.entry(Key!, Value!));
      }
    }
  }
}

function formatDate(date: Date): string {
  const ageInDays = getAgeInDays(date);

  return `${ageInDays} day${
    ageInDays === 1 ? `` : `s`
  } ago (${date.toLocaleDateString()})`;
}
