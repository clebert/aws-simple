import type {DevServerOptions, Throttling} from './new-types';

export * from './new-types';

export interface CustomDomainConfig {
  readonly certificateArn?: string;
  readonly hostedZoneName: string;
  readonly aliasRecordName?: string;
  readonly aliasRecordTtlInSeconds?: number;
}

export type LambdaHttpMethod =
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PUT';

export type LambdaLoggingLevel = 'OFF' | 'ERROR' | 'INFO';

export interface LambdaParameterOptions {
  readonly isCacheKey?: boolean;
  readonly required?: boolean;
}

export interface LambdaAcceptedParameters {
  readonly [parameterName: string]: LambdaParameterOptions;
}

export interface LambdaEnvironment {
  readonly [variableName: string]: string;
}

export interface LambdaConfig {
  readonly httpMethod: LambdaHttpMethod;
  readonly publicPath: string;
  readonly localPath: string;

  /**
   * A secret ID supporting wildcard to allow read access to secrets.
   */
  readonly secretId?: string;

  /**
   * A description can be useful to find a Lambda function in the AWS console.
   */
  readonly description?: string;
  readonly catchAll?: boolean;
  readonly handler?: string;
  readonly memorySize?: number;

  /**
   * Due to the default timeout of the API Gateway, the maximum timeout is
   * limited to 28 seconds.
   */
  readonly timeoutInSeconds?: number;

  /**
   * You can set the logging level for a Lambda function, it affects the log
   * entries pushed to Amazon CloudWatch Logs. The available levels are `OFF`,
   * `ERROR`, and `INFO`. Choose `ERROR` to write only error-level entries to
   * CloudWatch Logs, or choose `INFO` to include all `ERROR` events as well as
   * extra informational events.
   */
  readonly loggingLevel?: LambdaLoggingLevel;
  readonly cachingEnabled?: boolean;
  readonly cacheTtlInSeconds?: number;
  readonly acceptedParameters?: LambdaAcceptedParameters;
  readonly environment?: LambdaEnvironment;
  readonly authenticationRequired?: boolean;
  readonly devServer?: DevServerOptions;
}

export interface S3Config {
  readonly type: 'file' | 'folder';
  readonly binary?: boolean;
  readonly publicPath: string;
  readonly localPath: string;
  readonly bucketPath?: string;
  readonly responseHeaders?: Readonly<Record<string, string>>;
  readonly cachingEnabled?: boolean;
  readonly cacheTtlInSeconds?: number;
  readonly authenticationRequired?: boolean;
}

export interface BasicAuthenticationConfig {
  readonly username: string;
  readonly password: string;
  readonly cacheTtlInSeconds?: number;
  readonly realm?: string;
  readonly interactivePromptForXhr?: boolean;
}

export interface StackConfig {
  readonly customDomainConfig: CustomDomainConfig;
  readonly binaryMediaTypes?: string[];
  readonly minimumCompressionSizeInBytes?: number;
  readonly lambdaConfigs?: LambdaConfig[];
  readonly s3Configs?: S3Config[];
  readonly basicAuthenticationConfig?: BasicAuthenticationConfig;
  readonly webAclArn?: string;
  readonly throttling?: Throttling;

  /**
   * Note: Additionally, Lambda handlers must explicitly set any required CORS
   * headers like `Access-Control-Allow-Origin` on their response.
   */
  readonly enableCors?: boolean;
  readonly enableTracing?: boolean;
  readonly enableMetrics?: boolean;
  readonly enableAccessLogging?: boolean;
}

/**
 * @deprecated Please use the `App` interface instead of `AppConfig`.
 */
export interface AppConfig {
  readonly appName: string;
  readonly appVersion: string;
  readonly createStackConfig: (port?: number) => StackConfig;
}
