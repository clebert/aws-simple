declare module 'lambda-local' {
  import {APIGatewayProxyEvent, ProxyHandler, ProxyResult} from 'aws-lambda';
  import {Logger} from 'winston';

  export interface LambdaLocalExecuteOptions {
    readonly event?: Partial<APIGatewayProxyEvent>;
    readonly environment?: {readonly [key: string]: string};
    readonly lambdaPath?: string;
    readonly lambdaFunc?: ProxyHandler;
    readonly lambdaHandler?: string;
    readonly timeoutMs?: number;
    readonly verboseLevel?: 3 | 2 | 1 | 0;
  }

  export function execute(
    options: LambdaLocalExecuteOptions
  ): Promise<ProxyResult>;

  export function getLogger(): Logger;
  export function setLogger(logger: Logger): void;
}
