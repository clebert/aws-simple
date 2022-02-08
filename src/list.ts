import type {Stack} from '@aws-sdk/client-cloudformation';
import chalk from 'chalk';
import {getAgeInDays} from './utils/get-age-in-days';

export function list(stacks: readonly Stack[]): void {
  if (stacks.length === 0) {
    console.log(chalk.yellow(`No deloyed stacks found.`));

    return;
  }

  for (const stack of stacks) {
    console.log(
      `• ${chalk.bold(chalk.underline(`Stack`))}: ${stack.StackName}`,
    );

    const createdTimeInDays = getAgeInDays(stack.CreationTime!);

    console.log(
      `  • ${chalk.bold(chalk.underline(`Created`))}: ${createdTimeInDays} day${
        createdTimeInDays === 1 ? `` : `s`
      } ago (${stack.CreationTime!.toLocaleDateString()})`,
    );

    const updatedTimeInDays = getAgeInDays(stack.LastUpdatedTime!);

    if (updatedTimeInDays !== createdTimeInDays) {
      console.log(
        `  • ${chalk.bold(
          chalk.underline(`Updated`),
        )}: ${updatedTimeInDays} day${
          updatedTimeInDays === 1 ? `` : `s`
        } ago (${stack.LastUpdatedTime!.toLocaleDateString()})`,
      );
    }

    if (stack.Tags && stack.Tags?.length > 0) {
      console.log(`  • ${chalk.bold(chalk.underline(`Tags`))}:`);

      for (const {Key, Value} of stack.Tags) {
        console.log(`    • ${Key}: ${Value?.trim()}`);
      }
    }

    console.log(``);
  }
}
