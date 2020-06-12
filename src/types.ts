export interface CustomDomainConfig {
  readonly certificateArn: string;
  readonly hostedZoneId: string;
  readonly hostedZoneName: string;
  readonly aliasRecordName?: string;
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
   * A description can be useful to find a Lambda function in the AWS console.
   */
  readonly description?: string;
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
}

export interface S3ResponseHeaders {
  readonly cacheControl?: string;
}

export interface S3Config {
  readonly type: 'file' | 'folder';
  readonly binary?: boolean;
  readonly publicPath: string;
  readonly localPath: string;
  readonly bucketPath?: string;
  readonly responseHeaders?: S3ResponseHeaders;
  readonly cachingEnabled?: boolean;
  readonly cacheTtlInSeconds?: number;
  readonly authenticationRequired?: boolean;
}

export interface BasicAuthenticationConfig {
  readonly username: string;
  readonly password: string;
  readonly cacheTtlInSeconds?: number;
}

export interface StackConfig {
  readonly customDomainConfig?: CustomDomainConfig;
  readonly binaryMediaTypes?: string[];
  readonly minimumCompressionSizeInBytes?: number;
  readonly lambdaConfigs?: LambdaConfig[];
  readonly s3Configs?: S3Config[];
  readonly basicAuthenticationConfig?: BasicAuthenticationConfig;

  /**
   * Note: Additionally, Lambda handlers must explicitly set any required CORS
   * headers like `Access-Control-Allow-Origin` on their response.
   */
  readonly enableCors?: boolean;
}

export interface AppConfig {
  readonly appName: string;
  readonly appVersion: string;
  readonly createStackConfig: (port?: number) => StackConfig;
}
