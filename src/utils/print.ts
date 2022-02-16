import {isatty} from 'tty';
import {bold, gray, green, red, underline, yellow} from 'chalk';
import prompts from 'prompts';

let printed = false;

export function print(text: string): void {
  printed = true;

  console.log(text);
}

print.paragraph = (text: string): void => {
  if (printed) {
    console.log(``);
  }

  print(text);
};

print.info = (text: string): void => {
  print.paragraph(gray(text));
};

print.success = (text: string): void => {
  print.paragraph(green(text));
};

print.warning = (text: string): void => {
  print.paragraph(yellow(text));
};

print.error = (text: string): void => {
  console.error(red(text));
};

print.confirmation = async (message: string): Promise<boolean> => {
  if (!isatty(0)) {
    throw new Error(`Please specify the --yes CLI option.`);
  }

  if (printed) {
    console.log(``);
  }

  printed = true;

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

print.listItem = (
  indentationLevel: 0 | 1 | 2,
  item: ListEntry | ListHeadline | string,
): void => {
  let text =
    typeof item === `string`
      ? `• ${item}`
      : indentationLevel === 0
      ? item.type === `entry`
        ? `• ${underline(bold(item.key))}: ${item.value}`
        : `• ${underline(bold(item.text))}:`
      : item.type === `entry`
      ? `• ${bold(item.key)}: ${item.value}`
      : `• ${bold(item.text)}:`;

  if (indentationLevel === 0) {
    print.paragraph(text);
  } else {
    for (let i = 0; i < indentationLevel; i += 1) {
      text = `  ${text}`;
    }

    print(text);
  }
};
