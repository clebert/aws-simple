import path from 'path';
import {AppConfig} from '..';

// tslint:disable-next-line: no-any
function isAppConfig(value: any): value is AppConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    typeof value.appName === 'string' &&
    typeof value.stackName === 'string' &&
    typeof value.region === 'string'
  );
}

function assertName(value: string, valueName: string): void {
  const regExp = /^[a-z0-9-]+$/;

  if (!regExp.test(value)) {
    throw new Error(
      `The specified ${valueName} (${value}) contains invalid characters. It should match the following pattern: ${regExp.toString()}`
    );
  }
}

function validateAppConfig(appConfig: AppConfig): AppConfig {
  assertName(appConfig.appName, 'app name');
  assertName(appConfig.stackName, 'stack name');

  return appConfig;
}

export function loadAppConfig(
  configFilename: string,
  stackName?: string
): AppConfig {
  const absoluteConfigFilename = path.resolve(configFilename);

  try {
    const appConfig = require(absoluteConfigFilename).default;

    if (!isAppConfig(appConfig)) {
      throw new Error('No valid default export found.');
    }

    return validateAppConfig(stackName ? {...appConfig, stackName} : appConfig);
  } catch (error) {
    throw new Error(
      `The specified config file cannot be loaded: ${absoluteConfigFilename}\nCause: ${error.message}`
    );
  }
}
