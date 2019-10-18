import path from 'path';
import {AppConfig} from '../types';

// tslint:disable-next-line: no-any
function isAppConfig(value: any): value is AppConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    typeof value.appName === 'string' &&
    typeof value.appVersion === 'string' &&
    typeof value.createStackConfig === 'function'
  );
}

export function loadAppConfig(): AppConfig {
  let appConfig;

  try {
    const absoluteConfigFilename = path.resolve('aws-simple.config.js');

    appConfig = require(absoluteConfigFilename).default;
  } catch {
    throw new Error(`The config file cannot be loaded.`);
  }

  if (!isAppConfig(appConfig)) {
    throw new Error(`The config file does not export an AppConfig object.`);
  }

  return appConfig;
}
