import {App, Stack} from 'aws-cdk-lib';
import type {StackConfig} from '../read-stack-config';
import {getDomainName} from '../utils/get-domain-name';
import {getStackName} from '../utils/get-stack-name';

const {CDK_DEFAULT_ACCOUNT: account, CDK_DEFAULT_REGION: region} = process.env;

export function createStack(stackConfig: StackConfig): Stack {
  const {terminationProtectionEnabled = false, tags = {}} = stackConfig;

  return new Stack(new App(), `Stack`, {
    stackName: getStackName(getDomainName(stackConfig)),
    env: {account, region},
    terminationProtection: terminationProtectionEnabled,
    tags,
  });
}
