import {bold, underline} from 'chalk';
import type {Cli} from './cli';
import type {StackConfig} from './get-stack-config';
import {findStacks} from './sdk/find-stacks';
import {getAgeInDays} from './utils/get-age-in-days';

export interface ListArgs {
  readonly all: boolean;
  readonly hostedZoneName: string | undefined;
  readonly legacyAppName: string | undefined;
}

export async function list(
  cli: Cli,
  stackConfig: StackConfig,
  args: ListArgs,
): Promise<void> {
  const {all, legacyAppName} = args;
  const hostedZoneName = args.hostedZoneName || stackConfig.hostedZoneName;

  if (all) {
    cli.paragraph(bold(`No filters set.`), {messageType: `success`});
  } else {
    cli.paragraph(bold(`Filter by hosted zone name: ${hostedZoneName}`), {
      messageType: `warning`,
    });

    if (legacyAppName) {
      cli.span(
        bold(`${underline(`OR`)} Filter by legacy app name: ${legacyAppName}`),
        {messageType: `warning`},
      );
    }
  }

  const stacks = await findStacks(all ? {} : {hostedZoneName, legacyAppName});

  if (stacks.length === 0) {
    cli.paragraph(bold(`No matching stacks found.`), {messageType: `warning`});

    return;
  }

  for (const stack of stacks) {
    cli.paragraph(`${bold(underline(`Stack`))}: ${stack.StackName}`);

    const createdTimeInDays = getAgeInDays(stack.CreationTime!);

    cli.bullet(
      `${bold(`Created`)}: ${createdTimeInDays} day${
        createdTimeInDays === 1 ? `` : `s`
      } ago (${stack.CreationTime!.toLocaleDateString()})`,
      {indentationLevel: 1},
    );

    const updatedTimeInDays = getAgeInDays(stack.LastUpdatedTime!);

    if (updatedTimeInDays !== createdTimeInDays) {
      cli.bullet(
        `${bold(`Updated`)}: ${updatedTimeInDays} day${
          updatedTimeInDays === 1 ? `` : `s`
        } ago (${stack.LastUpdatedTime!.toLocaleDateString()})`,
        {indentationLevel: 1},
      );
    }

    if (stack.Tags && stack.Tags?.length > 0) {
      cli.bullet(`${bold(`Tags`)}:`, {indentationLevel: 1});

      for (const {Key, Value} of stack.Tags) {
        cli.bullet(`${Key}=${Value?.trim()}`, {indentationLevel: 2});
      }
    }
  }
}
