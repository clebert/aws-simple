import type { LambdaRuntime } from '../parse-stack-config.js';

import { aws_lambda } from 'aws-cdk-lib';

/**
 * Maps the lambda runtime config enum to CDK equivalents.
 *
 * @param lambdaRuntime the lambda config string or undefined
 * @returns the CDK runtime constant.
 */
export function mapLambdaRuntime(lambdaRuntime: LambdaRuntime): aws_lambda.Runtime {
  if (!lambdaRuntime) {
    return aws_lambda.Runtime.NODEJS_20_X;
  }
  switch (lambdaRuntime) {
    case `20.x`:
      return aws_lambda.Runtime.NODEJS_20_X;
    case `22.x`:
      return aws_lambda.Runtime.NODEJS_22_X;
    case `LATEST`:
      return aws_lambda.Runtime.NODEJS_LATEST;
  }
}
