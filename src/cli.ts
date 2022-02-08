import {bold, green, red, underline, yellow} from 'chalk';
import prompts from 'prompts';
import {getAgeInDays} from './utils/get-age-in-days';

export function formatDate(date: Date): string {
  const ageInDays = getAgeInDays(date);

  return `${ageInDays} day${
    ageInDays === 1 ? `` : `s`
  } ago (${date.toLocaleDateString()})`;
}

export function formatEntry(key: string, value: string): string {
  return `${bold(key.trim())}: ${value}`;
}

export function formatHeadline(text: string): string {
  return `${underline(bold(text))}:`;
}

export function formatSubheadline(text: string): string {
  return `${bold(text)}:`;
}

export function printList(indentationLevel: 0 | 1 | 2 | 3, text: string): void {
  text = `• ${text}`;

  if (indentationLevel === 0) {
    printParagraph(text);
  } else {
    for (let i = 0; i < indentationLevel; i += 1) {
      text = `  ${text}`;
    }

    printSpan(text);
  }
}

export function printError(...lines: readonly (string | undefined)[]): void {
  printParagraph(red(lines.filter(Boolean).join(`\n`)));
}

export function printSuccess(...lines: readonly (string | undefined)[]): void {
  printParagraph(green(lines.filter(Boolean).join(`\n`)));
}

export function printWarning(...lines: readonly (string | undefined)[]): void {
  printParagraph(yellow(lines.filter(Boolean).join(`\n`)));
}

let printed = false;

export async function printConfirmation(message: string): Promise<boolean> {
  if (printed) {
    console.log(``);
  }

  printed = true;

  const {result} = await prompts({type: `confirm`, name: `result`, message});

  return result;
}

function printParagraph(text: string): void {
  if (printed) {
    console.log(``);
  }

  printSpan(text);
}

function printSpan(text: string): void {
  printed = true;

  console.log(text);
}
