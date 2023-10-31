import {resolve} from 'path';
import {pathToFileURL} from 'url';

export async function readStackConfig(port?: number): Promise<unknown> {
  let module;

  const path = resolve(`aws-simple.config.mjs`);

  try {
    module = await import(pathToFileURL(path).href);
  } catch (error) {
    console.error(error);
    throw new Error(`The config file cannot be read: ${path}`);
  }

  if (typeof module.default !== `function`) {
    throw new Error(`The config file does not have a valid default export: ${path}`);
  }

  return module.default(port);
}
