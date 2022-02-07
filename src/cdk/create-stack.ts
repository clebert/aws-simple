import {App, Stack} from 'aws-cdk-lib';
import type {StackConfig} from '../get-stack-config';
import {getAbsoluteDomainName} from '../utils/get-absolute-domain-name';
import {getHash} from '../utils/get-hash';
import {getNormalizedName} from '../utils/get-normalized-name';

export function createStack(stackConfig: StackConfig): Stack {
  const domainName = getAbsoluteDomainName(stackConfig);

  return new Stack(new App(), `Stack`, {
    stackName: `aws-simple-${getNormalizedName(domainName)}-${getHash(
      domainName,
    )}`,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  });
}
