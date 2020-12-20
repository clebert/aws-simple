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
  readonly routeName?: string;
  readonly cacheTtlInSeconds?: number;
  readonly enableAuthentication?: boolean;
  readonly enableCors?: boolean;
}

export interface FunctionRoute extends CommonRoute {
  readonly kind: 'function';
  readonly filename: string;
  readonly catchAll?: boolean;
  readonly method?: FunctionMethod;
  readonly handler?: string;
  readonly memorySize?: number;
  readonly timeoutInSeconds?: number;
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
