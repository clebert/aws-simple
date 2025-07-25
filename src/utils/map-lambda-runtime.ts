import type { LambdaRuntime } from '../parse-stack-config.js';

import { aws_lambda } from 'aws-cdk-lib';

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
