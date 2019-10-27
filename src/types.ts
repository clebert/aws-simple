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
  readonly description?: string;
  readonly handler?: string;
  readonly memorySize?: number;
  readonly timeoutInSeconds?: number;
  readonly cachingEnabled?: boolean;
  readonly cacheTtlInSeconds?: number;
  readonly acceptedParameters?: LambdaAcceptedParameters;
  readonly environment?: LambdaEnvironment;
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
  readonly cachingEnabled?: boolean;
  readonly cacheTtlInSeconds?: number;
}

export interface StackConfig {
  readonly customDomainConfig?: CustomDomainConfig;
  readonly binaryMediaTypes?: string[];
  readonly minimumCompressionSizeInBytes?: number;
  readonly loggingLevel?: LoggingLevel;
  readonly lambdaConfigs?: LambdaConfig[];
  readonly s3Configs?: S3Config[];
}

export interface AppConfig {
  readonly appName: string;
  readonly appVersion: string;
  readonly createStackConfig: (port?: number) => StackConfig;
}
