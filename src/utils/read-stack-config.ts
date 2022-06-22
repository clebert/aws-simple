import {resolve} from 'path';
import {pathToFileURL} from 'url';
import type {StackConfig} from '../stack-config.js';
import {validateRoutes} from './validate-routes.js';
import {validateStackConfig} from './validate-stack-config.js';

export async function readStackConfig(port?: number): Promise<StackConfig> {
  let module;

  const path = resolve(`aws-simple.config.mjs`);

  try {
    module = await import(pathToFileURL(path).href);
  } catch (error) {
    console.error(error);
    throw new Error(`The config file cannot be read: ${path}`);
  }

  if (typeof module.default !== `function`) {
    throw new Error(
      `The config file does not have a valid default export: ${path}`,
    );
  }

  const stackConfig = validateStackConfig(module.default(port));

  validateRoutes(stackConfig.routes);

  return stackConfig;
}
