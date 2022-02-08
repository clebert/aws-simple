import chalk from 'chalk';
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
    console.log(chalk.bold(chalk.green(`No filters set.`)));
  } else {
    console.log(
      chalk.bold(chalk.yellow(`Filter by hosted zone name: ${hostedZoneName}`)),
    );

    if (legacyAppName) {
      console.log(
        chalk.bold(
          chalk.yellow(
            `${chalk.underline(
              `OR`,
            )} Filter by legacy app name: ${legacyAppName}`,
          ),
        ),
      );
    }
  }

  const stacks = await findStacks(all ? {} : {hostedZoneName, legacyAppName});

  if (stacks.length === 0) {
    console.log(chalk.yellow(`\nNo matching stacks found.`));

    return;
  }

  for (const stack of stacks) {
    console.log(
      `\n• ${chalk.bold(chalk.underline(`Stack`))}: ${stack.StackName}`,
    );

    const createdTimeInDays = getAgeInDays(stack.CreationTime!);

    console.log(
      `  • ${chalk.bold(`Created`)}: ${createdTimeInDays} day${
        createdTimeInDays === 1 ? `` : `s`
      } ago (${stack.CreationTime!.toLocaleDateString()})`,
    );

    const updatedTimeInDays = getAgeInDays(stack.LastUpdatedTime!);

    if (updatedTimeInDays !== createdTimeInDays) {
      console.log(
        `  • ${chalk.bold(`Updated`)}: ${updatedTimeInDays} day${
          updatedTimeInDays === 1 ? `` : `s`
        } ago (${stack.LastUpdatedTime!.toLocaleDateString()})`,
      );
    }

    if (stack.Tags && stack.Tags?.length > 0) {
      console.log(`  • ${chalk.bold(`Tags`)}:`);

      for (const {Key, Value} of stack.Tags) {
        console.log(`    • ${Key}: ${Value?.trim()}`);
      }
    }
  }
}
