import {green, red, yellow} from 'chalk';
import prompts from 'prompts';

export interface MessageOptions {
  readonly indentationLevel?: number;
  readonly messageType?: MessageType;
}

export type MessageType = 'error' | 'info' | 'success' | 'warning';

export class Cli {
  #printed = false;

  bullet(message: string, options: MessageOptions = {}): void {
    this.#print(`• ${message}`, options);
  }

  async confirmation(message: string): Promise<boolean> {
    if (this.#printed) {
      console.log(``);
    }

    const {result} = await prompts({type: `confirm`, name: `result`, message});

    return result;
  }

  paragraph(message: string, options: MessageOptions = {}): void {
    if (this.#printed) {
      console.log(``);
    }

    this.#print(message, options);
  }

  span(message: string, options: MessageOptions = {}): void {
    this.#print(message, options);
  }

  #print(message: string, options: MessageOptions): void {
    const {indentationLevel = 0, messageType = `info`} = options;

    message = message.trim();

    if (!message) {
      throw new Error(`Unexpectedly blank message.`);
    }

    this.#printed = true;

    for (let i = 0; i < indentationLevel; i += 1) {
      message = `  ${message}`;
    }

    switch (messageType) {
      case `error`:
        return console.log(red(message));
      case `info`:
        return console.log(message);
      case `success`:
        return console.log(green(message));
      case `warning`:
        return console.log(yellow(message));
      default:
        assertUnreachable(messageType);
    }
  }
}

function assertUnreachable(_: never) {}
