declare module 'lambda-local' {
  import type {
    APIGatewayProxyEvent,
    ProxyHandler,
    ProxyResult,
  } from 'aws-lambda';
  import type {Logger} from 'winston';

  type DeepPartial<T extends {}> = {[K in keyof T]?: DeepPartial<T[K]>};

  export interface LambdaLocalExecuteOptions {
    readonly event?: DeepPartial<APIGatewayProxyEvent>;
    readonly environment?: Readonly<Record<string, string>>;
    readonly lambdaPath?: string;
    readonly lambdaFunc?: ProxyHandler;
    readonly lambdaHandler?: string;
    readonly timeoutMs?: number;
    readonly verboseLevel?: 3 | 2 | 1 | 0;
  }

  export function execute(
    options: LambdaLocalExecuteOptions,
  ): Promise<ProxyResult>;

  export function getLogger(): Logger;
  export function setLogger(logger: Logger): void;
}
