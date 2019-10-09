import path from 'path';
import {AppConfig} from '..';

// tslint:disable-next-line: no-any
function isAppConfig(value: any): value is AppConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    typeof value.appName === 'string' &&
    typeof value.defaultStackName === 'string' &&
    typeof value.region === 'string'
  );
}

export function loadAppConfig(configFilename: string): AppConfig {
  const absoluteConfigFilename = path.resolve(configFilename);

  try {
    const appConfig = require(absoluteConfigFilename).default;

    if (!isAppConfig(appConfig)) {
      throw new Error('No valid default export found.');
    }

    return appConfig;
  } catch (error) {
    throw new Error(
      `The specified config file cannot be loaded: ${absoluteConfigFilename}\nCause: ${error.message}`
    );
  }
}
