import type {RestApiBase} from 'aws-cdk-lib/aws-apigateway';
import type {FunctionBase} from 'aws-cdk-lib/aws-lambda';
import type {Stack} from 'aws-cdk-lib/core';

export interface StackConfig {
  readonly hostedZoneName: string;
  readonly subdomainName?: string;
  readonly authentication?: Authentication;
  readonly throttling?: Throttling;
  readonly monitoring?: Monitoring;
  readonly routes: readonly [Route, ...Route[]];
  readonly onSynthesize?: (constructs: StackConstructs) => void;
}

export interface Authentication {
  readonly username: string;
  readonly password: string;
  readonly realm?: string;
  readonly cacheTtlInSeconds?: number;
}

export interface Throttling {
  readonly burstLimit: number;
  readonly rateLimit: number;
}

export interface Monitoring {
  readonly accessLoggingEnabled?: boolean;
  readonly loggingEnabled?: boolean;
  readonly metricsEnabled?: boolean;
  readonly tracingEnabled?: boolean;
}

export interface StackConstructs {
  readonly stack: Stack;
  readonly restApi: RestApiBase;
}

export type Route = S3Route | LambdaFunctionRoute;
export type S3Route = S3FileRoute | S3FolderRoute;

export interface RouteBase {
  readonly publicPath: string;
  readonly cacheTtlInSeconds?: number;
  readonly authenticationEnabled?: boolean;
  readonly corsEnabled?: boolean;
}

export interface S3FileRoute extends RouteBase {
  readonly type: 'file' | 'file+';
  readonly filename: string;
  readonly responseHeaders?: Readonly<Record<string, string>>;
}

export interface S3FolderRoute extends RouteBase {
  readonly type: 'folder+';
  readonly dirname: string;
  readonly responseHeaders?: Readonly<Record<string, string>>;
}

export interface LambdaFunctionRoute extends RouteBase {
  readonly type: 'function' | 'function+';
  readonly httpMethod: HttpMethod;
  readonly identifier: string;
  readonly filename: string;
  readonly memorySize?: number;
  readonly timeoutInSeconds?: number;
  readonly environment?: Readonly<Record<string, string>>;
  readonly requestParameters?: Readonly<
    Record<string, RequestParameterOptions>
  >;
  readonly devServerOptions?: DevServerOptions;
  readonly onSynthesize?: (constructs: LambdaFunctionConstructs) => void;
}

export type HttpMethod =
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PUT';

export interface RequestParameterOptions {
  readonly cacheKey?: boolean;
  readonly required?: boolean;
}

export interface DevServerOptions {
  /**
   * Shared file dependencies from all Lambda functions that should be included
   * in the files watched for cache invalidation.
   */
  readonly sharedFileDependencies?: string[];
}

export interface LambdaFunctionConstructs extends StackConstructs {
  readonly lambdaFunction: FunctionBase;
}
