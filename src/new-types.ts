export interface App {
  readonly appName: string;
  readonly appVersion?: string;
  readonly customDomain?: CustomDomain;
  readonly authentication?: Authentication;
  readonly disableCompression?: boolean;
  readonly routes: (port?: number) => Routes;
}

export interface CustomDomain {
  readonly certificateArn: string;
  readonly hostedZoneId: string;
  readonly hostedZoneName: string;
  readonly aliasRecordName?: string;
}

export interface Authentication {
  readonly username: string;
  readonly password: string;
  readonly cacheTtlInSeconds?: number;
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

export interface FunctionRoute extends CommonRoute {
  readonly kind: 'function';
  readonly filename: string;
  readonly description?: string;
  readonly catchAll?: boolean;

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
  readonly cacheControl?: string;
}

export interface FolderRoute extends CommonRoute {
  readonly kind: 'folder';
  readonly dirname: string;
  readonly binaryMediaTypes?: readonly [string, ...string[]];
  readonly cacheControl?: string;
}
