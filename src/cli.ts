import {bold, green, red, underline, yellow} from 'chalk';
import prompts from 'prompts';

export function entry(key: string, value: string): string {
  return `${bold(key.trim())}: ${value}`;
}

export function headline(text: string): string {
  return `${underline(bold(text))}:`;
}

export function subheadline(text: string): string {
  return `${bold(text)}:`;
}

export function listItem(indentationLevel: 0 | 1 | 2 | 3, text: string): void {
  text = `• ${text}`;

  if (indentationLevel === 0) {
    paragraph(text);
  } else {
    for (let i = 0; i < indentationLevel; i += 1) {
      text = `  ${text}`;
    }

    span(text);
  }
}

export function error(...lines: readonly (string | undefined)[]): void {
  paragraph(red(lines.filter(Boolean).join(`\n`)));
}

export function success(...lines: readonly (string | undefined)[]): void {
  paragraph(green(lines.filter(Boolean).join(`\n`)));
}

export function warning(...lines: readonly (string | undefined)[]): void {
  paragraph(yellow(lines.filter(Boolean).join(`\n`)));
}

let printed = false;

export async function confirmation(message: string): Promise<boolean> {
  if (printed) {
    console.log(``);
  }

  printed = true;

  const {result} = await prompts({type: `confirm`, name: `result`, message});

  return result;
}

function paragraph(text: string): void {
  if (printed) {
    console.log(``);
  }

  span(text);
}

function span(text: string): void {
  printed = true;

  console.log(text);
}
