import {App, Stack} from 'aws-cdk-lib/core';

export interface StackInit {
  readonly stackName: string;
}

export function createStack(init: StackInit): Stack {
  const {stackName} = init;

  return new Stack(new App(), `Stack`, {
    stackName,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  });
}
