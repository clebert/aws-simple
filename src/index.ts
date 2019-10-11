#!/usr/bin/env node

import './init-aws-sdk';

import 'source-map-support/register';

import compose from 'compose-function';
import yargs from 'yargs';
import {cleanUp} from './commands/clean-up';
import {create} from './commands/create';
import {list} from './commands/list';
import {start} from './commands/start';
import {tag} from './commands/tag';
import {upload} from './commands/upload';

export interface CustomDomainConfig {
  readonly certificateArn: string;
  readonly hostedZoneId: string;
  readonly hostedZoneName: string;
  readonly getAliasRecordName?: (stackName: string) => string;
}

export type LoggingLevel = 'OFF' | 'ERROR' | 'INFO';

export type LambdaHttpMethod =
  | 'ANY'
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PUT';

export interface LambdaParameterOptions {
  readonly isCacheKey?: boolean;
  readonly required?: boolean;
}

export interface LambdaAcceptedParameters {
  readonly [parameterName: string]: LambdaParameterOptions;
}

export interface LambdaAwsRuntime {
  readonly type: 'aws';
  readonly stackName: string;
}

export interface LambdaDevRuntime {
  readonly type: 'dev';
  readonly port: number;
}

export type LambdaRuntime = LambdaAwsRuntime | LambdaDevRuntime;

export interface LambdaEnvironment {
  readonly [variableName: string]: string;
}

export interface LambdaConfig {
  readonly httpMethod: LambdaHttpMethod;
  readonly publicPath: string;
  readonly localPath: string;
  readonly handler?: string;
  readonly memorySize?: number;
  readonly timeoutInSeconds?: number;
  readonly cachingEnabled?: boolean;
  readonly cacheTtlInSeconds?: number;
  readonly acceptedParameters?: LambdaAcceptedParameters;
  readonly getEnvironment?: (runtime: LambdaRuntime) => LambdaEnvironment;
}

export interface S3ResponseHeaders {
  readonly accessControlAllowOrigin?: string;
  readonly cacheControl?: string;
}

export interface S3Config {
  readonly type: 'file' | 'folder';
  readonly publicPath: string;
  readonly localPath: string;
  readonly bucketPath?: string;
  readonly responseHeaders?: S3ResponseHeaders;
}

export interface AppConfig {
  readonly appName: string;
  readonly defaultStackName: string;
  readonly customDomainConfig?: CustomDomainConfig;
  readonly binaryMediaTypes?: string[];
  readonly minimumCompressionSizeInBytes?: number;
  readonly loggingLevel?: LoggingLevel;
  readonly lambdaConfigs?: LambdaConfig[];
  readonly s3Configs?: S3Config[];
}

function handleError(error: Error): void {
  console.error(error.toString());

  process.exit(1);
}

try {
  // tslint:disable-next-line: no-require-imports no-var-requires
  const {description} = require('../package.json');

  const argv = compose(
    cleanUp.describe,
    tag.describe,
    list.describe,
    start.describe,
    upload.describe,
    create.describe
  )(
    yargs
      .usage('Usage: $0 <command> [options]')
      .help('h')
      .alias('h', 'help')
      .detectLocale(false)
      .demandCommand()
      .epilogue(description)
  ).argv;

  if (create.matches(argv)) {
    create(argv);
  } else if (upload.matches(argv)) {
    upload(argv).catch(handleError);
  } else if (start.matches(argv)) {
    start(argv);
  } else if (list.matches(argv)) {
    list(argv).catch(handleError);
  } else if (tag.matches(argv)) {
    tag(argv).catch(handleError);
  } else if (cleanUp.matches(argv)) {
    cleanUp(argv).catch(handleError);
  }
} catch (error) {
  handleError(error);
}
