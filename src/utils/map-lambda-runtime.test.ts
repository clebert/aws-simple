import { mapLambdaRuntime } from './map-lambda-runtime.js';
import { describe, expect, test } from '@jest/globals';
import { aws_lambda } from 'aws-cdk-lib';

describe(`mapLambdaRuntime()`, () => {
  test(`returns a mapped runtime object`, () => {
    expect(mapLambdaRuntime(undefined)).toEqual(aws_lambda.Runtime.NODEJS_20_X);
    expect(mapLambdaRuntime(`20.x`)).toEqual(aws_lambda.Runtime.NODEJS_20_X);
    expect(mapLambdaRuntime(`22.x`)).toEqual(aws_lambda.Runtime.NODEJS_22_X);
    expect(mapLambdaRuntime(`LATEST`)).toEqual(aws_lambda.Runtime.NODEJS_LATEST);
  });
});
