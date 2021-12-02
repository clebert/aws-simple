import path from 'path';
import type {App, AppConfig} from '../types';
import {isObject} from './is-object';
import {translateAppConfig} from './translate-app-config';

function isApp(value: unknown): value is App {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.appName === `string` && typeof value.routes === `function`
  );
}

function isAppConfig(value: unknown): value is AppConfig {
  if (!isObject(value)) {
    return false;
  }

  return (
    typeof value.appName === `string` &&
    typeof value.createStackConfig === `function`
  );
}

export function loadAppConfig(): AppConfig {
  let appConfig;

  try {
    const absoluteConfigFilename = path.resolve(`aws-simple.config.js`);

    appConfig = require(absoluteConfigFilename).default;
  } catch (error) {
    console.error(`The aws-simple config file cannot be loaded.`);

    throw error;
  }

  if (isAppConfig(appConfig)) {
    console.warn(
      `aws-simple:`,
      `You are using a deprecated configuration format.`
    );

    return appConfig;
  }

  if (isApp(appConfig)) {
    return translateAppConfig(appConfig);
  }

  throw new Error(
    `The aws-simple config file does not have a valid default export.`
  );
}
