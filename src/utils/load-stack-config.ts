import path from 'path';
import {StackConfig} from '..';

function isObject(value: unknown): boolean {
  return typeof value === 'object' && value !== null;
}

export function loadStackConfig(filename: string): StackConfig {
  const absoluteFilename = path.resolve(filename);

  try {
    const stackConfig = require(absoluteFilename).default;

    if (!isObject(stackConfig) || typeof stackConfig.stackId !== 'string') {
      throw new Error('No valid stack config object found as default export.');
    }

    return stackConfig;
  } catch (error) {
    throw new Error(
      `The specified config file cannot be loaded: ${absoluteFilename}\nCause: ${error.message}`
    );
  }
}
