import {resolve} from 'path';
import type {Stack, aws_apigateway, aws_lambda} from 'aws-cdk-lib';
import {validateRoutes} from './utils/validate-routes';

export interface StackConfig {
  readonly hostedZoneName: string;
  readonly aliasRecordName?: string;
  readonly cachingEnabled?: boolean;
  readonly terminationProtectionEnabled?: boolean;
  readonly authentication?: Authentication;
  readonly monitoring?: true | Monitoring;
  readonly tags?: Readonly<Record<string, string>>;
  readonly routes: readonly [Route, ...Route[]];

  readonly onSynthesize?: (constructs: {
    readonly stack: Stack;
    readonly restApi: aws_apigateway.RestApiBase;
  }) => void;
}

export interface Authentication {
  readonly username: string;
  readonly password: string;
  readonly realm?: string;
  /** Default: `300` seconds (if caching is enabled) */
  readonly cacheTtlInSeconds?: number;
}

export interface Monitoring {
  readonly accessLoggingEnabled?: boolean;
  readonly loggingEnabled?: boolean;
  readonly metricsEnabled?: boolean;
  readonly tracingEnabled?: boolean;
}

export type Route = LambdaRoute | S3Route;

export interface LambdaRoute extends RouteOptions {
  readonly type: 'function';
  readonly httpMethod: 'DELETE' | 'GET' | 'HEAD' | 'PATCH' | 'POST' | 'PUT';
  readonly publicPath: string;
  readonly path: string;
  readonly functionName: string;
  /** Default: `128` MB */
  readonly memorySize?: number;
  /** Default: `28` seconds (this is the maximum timeout) */
  readonly timeoutInSeconds?: number;
  readonly environment?: Readonly<Record<string, string>>;
  readonly requestParameters?: Readonly<Record<string, LambdaRequestParameter>>;

  readonly onSynthesize?: (constructs: {
    readonly stack: Stack;
    readonly restApi: aws_apigateway.RestApiBase;
    readonly lambdaFunction: aws_lambda.FunctionBase;
  }) => void;
}

export interface LambdaRequestParameter {
  readonly cacheKey?: boolean;
  readonly required?: boolean;
}

export interface S3Route extends RouteOptions {
  readonly type: 'file' | 'folder';
  readonly httpMethod?: 'GET';
  readonly publicPath: string;
  readonly path: string;
  readonly responseHeaders?: Readonly<Record<string, string>>;
}

export interface RouteOptions {
  readonly throttling?: Throttling;
  /** Default: `300` seconds (if caching is enabled) */
  readonly cacheTtlInSeconds?: number;
  readonly authenticationEnabled?: boolean;
  readonly corsEnabled?: boolean;
}

export interface Throttling {
  /** Default: `10000` requests per second */
  readonly rateLimit: number;
  /** Default: `5000` requests */
  readonly burstLimit: number;
}

export function readStackConfig(port?: number): StackConfig {
  let defaultExport;

  const path = resolve(`aws-simple.config.js`);

  try {
    defaultExport = require(path).default;
  } catch (error) {
    throw new Error(`The config file cannot be read: ${path}`);
  }

  if (typeof defaultExport !== `function`) {
    throw new Error(
      `The config file does not have a valid default export: ${path}`,
    );
  }

  const stackConfig = defaultExport(port) as StackConfig;

  validateRoutes(stackConfig.routes);

  return stackConfig;
}
