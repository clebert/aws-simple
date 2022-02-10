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

print.info = (...lines: readonly (string | undefined)[]): void => {
  print.paragraph(gray(lines.filter(Boolean).join(`\n`)));
};

print.success = (...lines: readonly (string | undefined)[]): void => {
  print.paragraph(green(lines.filter(Boolean).join(`\n`)));
};

print.warning = (...lines: readonly (string | undefined)[]): void => {
  print.paragraph(yellow(lines.filter(Boolean).join(`\n`)));
};

print.error = (...lines: readonly (string | undefined)[]): void => {
  if (printed) {
    console.error(``);
  }

  console.error(red(lines.filter(Boolean).join(`\n`)));
};

print.confirmation = async (message: string): Promise<boolean> => {
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
      : item.type === `entry`
      ? `• ${bold(item.key)}: ${item.value}`
      : indentationLevel === 0
      ? `• ${underline(bold(item.text))}:`
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
