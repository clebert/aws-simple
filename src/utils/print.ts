import chalk from 'chalk';
import prompts from 'prompts';
import {isatty} from 'tty';

export function print(text: string): void {
  console.log(text);
}

print.info = (text: string): void => {
  print(chalk.gray(text));
};

print.success = (text: string): void => {
  print(chalk.green(text));
};

print.warning = (text: string): void => {
  print(chalk.yellow(text));
};

print.error = (text: string): void => {
  console.error(chalk.red(text));
};

print.confirmation = async (message: string): Promise<boolean> => {
  if (!isatty(0)) {
    throw new Error(`Please specify the --yes CLI option.`);
  }

  const {result} = await prompts({type: `confirm`, name: `result`, message});

  return result;
};

export interface ListEntry {
  readonly type: 'entry';
  readonly key: string;
  readonly value: string;
}

export interface ListHeadline {
  readonly type: 'headline';
  readonly text: string;
}

print.listItem = (indentationLevel: 0 | 1 | 2, item: ListEntry | ListHeadline | string): void => {
  let text =
    typeof item === `string`
      ? `• ${item}`
      : item.type === `entry`
      ? `• ${chalk.bold(item.key)}: ${item.value}`
      : `• ${chalk.bold(item.text)}`;

  for (let i = 0; i < indentationLevel; i += 1) {
    text = `  ${text}`;
  }

  print(text);
};
