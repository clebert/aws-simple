import path from 'path';
import {App, AppConfig} from '../types';
import {isObject} from './is-object';
import {translateAppConfig} from './translate-app-config';

function isApp(value: unknown): value is App {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.appName === 'string' && typeof value.routes === 'function'
  );
}

function isAppConfig(value: unknown): value is AppConfig {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.appName === 'string' &&
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

  if (isAppConfig(appConfig)) {
    console.warn(
      'You are using a deprecated configuration format. Please use the App interface instead of AppConfig.'
    );

    return appConfig;
  }

  if (isApp(appConfig)) {
    return translateAppConfig(appConfig);
  }

  throw new Error(
    `The config file does not export an App or AppConfig object.`
  );
}
