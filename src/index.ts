#!/usr/bin/env node

import 'source-map-support/register';

import {RestApi} from '@aws-cdk/aws-apigateway';
import {Role} from '@aws-cdk/aws-iam';
import {Bucket} from '@aws-cdk/aws-s3';
import {Stack} from '@aws-cdk/core';
import yargs from 'yargs';
import {create, describeCreateCommand, isCreateArgv} from './commands/create';
import {describeStartCommand, isStartArgv, start} from './commands/start';
import {describeUploadCommand, isUploadArgv, upload} from './commands/upload';

export interface CustomDomainConfig {
  readonly certificateArn: string;
  readonly hostedZoneId: string;
  readonly hostedZoneName: string;
  readonly aliasRecordName?: string;
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

export interface LambdaConfig {
  readonly httpMethod: LambdaHttpMethod;
  readonly publicPath: string;
  readonly localPath: string;
  readonly handler?: string;
  readonly memorySize?: number;
  readonly timeoutInSeconds?: number;
  readonly environment?: {readonly [key: string]: string};
  readonly cachingEnabled?: boolean;
  readonly cacheTtlInSeconds?: number;
  readonly cacheKeyParameters?: string[];
  readonly requiredParameters?: string[];
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

export interface Deployment {
  readonly stack: Stack;
  readonly restApi: RestApi;
  readonly s3Bucket: Bucket;
  readonly s3IntegrationRole: Role;
}

export type CustomHook = (deployment: Deployment) => void;

export interface StackConfig {
  readonly customDomainConfig?: CustomDomainConfig;
  readonly binaryMediaTypes?: string[];
  readonly minimumCompressionSize?: number;
  readonly loggingLevel?: LoggingLevel;
  readonly lambdaConfigs?: LambdaConfig[];
  readonly s3Configs?: S3Config[];
  readonly customHook?: CustomHook;
}

export interface AppConfig {
  readonly appName: string;
  readonly stackName: string;
  readonly stackConfig?: StackConfig;
}

function handleError(error: Error): void {
  console.error(error.toString());

  process.exit(1);
}

// tslint:disable-next-line: no-require-imports no-var-requires
const {description} = require('../package.json');

try {
  const argv = describeStartCommand(
    describeUploadCommand(
      describeCreateCommand(
        yargs
          .usage('Usage: $0 <command> [options]')
          .help('h')
          .alias('h', 'help')
          .detectLocale(false)
          .demandCommand()
          .epilogue(description)
      )
    )
  ).argv;

  if (isCreateArgv(argv)) {
    create(argv);
  } else if (isStartArgv(argv)) {
    start(argv);
  } else if (isUploadArgv(argv)) {
    upload(argv).catch(handleError);
  }
} catch (error) {
  handleError(error);
}
