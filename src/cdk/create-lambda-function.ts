import {basename, dirname, extname} from 'path';
import type {FunctionBase} from 'aws-cdk-lib/aws-lambda';
import {
  Code,
  Function as LambdaFunction,
  Runtime,
  Tracing,
} from 'aws-cdk-lib/aws-lambda';
import {RetentionDays} from 'aws-cdk-lib/aws-logs';
import type {Stack} from 'aws-cdk-lib/core';
import {Duration} from 'aws-cdk-lib/core';
import {getHash} from './get-hash';

export interface LambdaFunctionInit {
  readonly stack: Stack;
  readonly functionName: string;
  readonly filename: string;
  readonly memorySize: number | undefined;
  readonly timeoutInSeconds: number | undefined;
  readonly environment: Readonly<Record<string, string>> | undefined;
}

const maxTimeoutInSeconds = 28;

export function createLambdaFunction(init: LambdaFunctionInit): FunctionBase {
  const {
    stack,
    functionName,
    filename,
    memorySize = 128,
    timeoutInSeconds = maxTimeoutInSeconds,
    environment,
  } = init;

  const moduleName = basename(filename, extname(filename));

  if (/^[\w-]+$/.test(moduleName)) {
    throw new Error(`Invalid Lambda function filename.`);
  }

  if (timeoutInSeconds > maxTimeoutInSeconds) {
    console.warn(
      `The timeout of a Lambda function must be less than the maximum API gateway integration timeout of 29 seconds.`,
    );
  }

  return new LambdaFunction(stack, `LambdaFunction${getHash(functionName)}`, {
    functionName,
    code: Code.fromAsset(dirname(filename)),
    handler: `${moduleName}.handler`,
    memorySize,
    environment,
    timeout: Duration.seconds(Math.min(timeoutInSeconds, maxTimeoutInSeconds)),
    runtime: Runtime.NODEJS_14_X,
    tracing: Tracing.PASS_THROUGH,
    logRetention: RetentionDays.TWO_WEEKS, // TODO: make configurable
  });
}
