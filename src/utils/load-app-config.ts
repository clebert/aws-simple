import path from 'path';
import {AppConfig, AppConfigCreator} from '../types';

// tslint:disable-next-line: no-any
function isAppConfigCreator(value: any): value is AppConfigCreator {
  return typeof value === 'function';
}

// tslint:disable-next-line: no-any
function isAppConfig(value: any): value is AppConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return (
    typeof value.appName === 'string' && typeof value.appVersion === 'string'
  );
}

export function loadAppConfig(port?: number): AppConfig {
  let createAppConfig;

  try {
    const absoluteConfigFilename = path.resolve('aws-simple.config.js');

    createAppConfig = require(absoluteConfigFilename).default;
  } catch {
    throw new Error(`The config file cannot be loaded.`);
  }

  if (!isAppConfigCreator(createAppConfig)) {
    throw new Error(
      `The config file does not export an AppConfigCreator function.`
    );
  }

  const appConfig = createAppConfig(port);

  if (!isAppConfig(appConfig)) {
    throw new Error(`The created AppConfig object is invalid.`);
  }

  return appConfig;
}
