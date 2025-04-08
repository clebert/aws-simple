import type { StackConfig } from '../parse-stack-config.js';

import { getDomainName } from '../utils/get-domain-name.js';
import { getStackName } from '../utils/get-stack-name.js';
import { App, Stack } from 'aws-cdk-lib';

const { CDK_DEFAULT_ACCOUNT: account, CDK_DEFAULT_REGION: region } = process.env;
const regionTagName = `aws-simple-region`;

export function createStack(stackConfig: StackConfig): Stack {
  const { terminationProtectionEnabled = false, tags = {} } = stackConfig;
  if (region) {
    tags[regionTagName] = region;
  }

  return new Stack(new App(), `Stack`, {
    stackName: getStackName(getDomainName(stackConfig)),
    env: { account, region },
    terminationProtection: terminationProtectionEnabled,
    tags,
  });
}
