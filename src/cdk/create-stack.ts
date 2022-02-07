import {App, Stack} from 'aws-cdk-lib';
import type {StackConfig} from '../get-stack-config';
import {getAbsoluteDomainName} from '../utils/get-absolute-domain-name';
import {getStackName} from '../utils/get-stack-name';

export function createStack(stackConfig: StackConfig): Stack {
  return new Stack(new App(), `Stack`, {
    stackName: getStackName(getAbsoluteDomainName(stackConfig)),
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  });
}
