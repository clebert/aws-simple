export interface App {
  readonly appName: string;
  readonly appVersion?: string;
  readonly customDomain: CustomDomain;
  readonly authentication?: Authentication;
  readonly disableCompression?: boolean;
  readonly webAclArn?: string;
  readonly throttling?: Throttling;
  readonly enableTracing?: boolean;
  readonly enableMetrics?: boolean;
  readonly enableAccessLogging?: boolean;
  readonly routes: (port?: number) => Routes;
}

export interface CustomDomain {
  readonly certificateArn?: string;
  readonly hostedZoneName: string;
  readonly aliasRecordName?: string;
  readonly aliasRecordTtlInSeconds?: number;
}

export interface Authentication {
  readonly username: string;
  readonly password: string;
  readonly cacheTtlInSeconds?: number;
  readonly realm?: string;
  readonly interactivePromptForXhr?: boolean;
}

export interface Throttling {
  readonly burstLimit: number;
  readonly rateLimit: number;
}

export interface Routes {
  readonly [path: string]: Route;
}

export type Route = FunctionRoute | FileRoute | FolderRoute;

export interface CommonRoute {
  readonly cacheTtlInSeconds?: number;
  readonly enableAuthentication?: boolean;

  /**
   * Additionally, Lambda functions must explicitly set any required CORS
   * headers like `Access-Control-Allow-Origin` on their response.
   */
  readonly enableCors?: boolean;
}

export interface DevServerOptions {
  /**
   * Local path dependencies for a Lambda function that should be included in
   * the files watched for cache invalidation.
   */
  readonly localPathDependencies?: string[];
}

export interface FunctionRoute extends CommonRoute {
  readonly kind: 'function';
  readonly filename: string;
  readonly description?: string;
  readonly catchAll?: boolean;

  /**
   * A secret ID supporting wildcard to allow read access to secrets.
   */
  readonly secretId?: string;

  /**
   * Default: `'GET'`
   */
  readonly method?: FunctionMethod;

  /**
   * Default: `'handler'`
   */
  readonly handler?: string;

  /**
   * Default: `128`
   */
  readonly memorySize?: number;

  /**
   * Due to the default timeout of the API Gateway, the maximum timeout is
   * limited to 28 seconds. Default: `28`
   */
  readonly timeoutInSeconds?: number;

  /**
   * You can set the logging level for a Lambda function, it affects the log
   * entries pushed to Amazon CloudWatch Logs. The available levels are `'OFF'`,
   * `'ERROR'`, and `'INFO'`. Choose `'ERROR'` to write only error-level entries
   * to CloudWatch Logs, or choose `'INFO'` to include all `'ERROR'` events as
   * well as extra informational events. Default: `'INFO'`
   */
  readonly loggingLevel?: FunctionLoggingLevel;
  readonly parameters?: Readonly<Record<string, FunctionParameterOptions>>;
  readonly environment?: Readonly<Record<string, string>>;
  readonly devServer?: DevServerOptions;
}

export type FunctionMethod =
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PUT';

export type FunctionLoggingLevel = 'OFF' | 'ERROR' | 'INFO';

export interface FunctionParameterOptions {
  readonly cached?: boolean;
  readonly required?: boolean;
}

export interface FileRoute extends CommonRoute {
  readonly kind: 'file';
  readonly filename: string;
  readonly catchAll?: boolean;
  readonly binaryMediaType?: string;
  readonly responseHeaders?: Readonly<Record<string, string>>;
}

export interface FolderRoute extends CommonRoute {
  readonly kind: 'folder';
  readonly dirname: string;
  readonly binaryMediaTypes?: readonly [string, ...string[]];
  readonly responseHeaders?: Readonly<Record<string, string>>;
}
