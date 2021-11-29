import type {CloudFormation} from 'aws-sdk';
import type {StackConfig} from '../types';
import {findStackOutput} from './find-stack-output';

export function createStackBaseUrl(
  stackConfig: StackConfig,
  stack: CloudFormation.Stack
): string {
  const {customDomainConfig} = stackConfig;

  if (!customDomainConfig) {
    return findStackOutput(stack, 'RestApiUrl');
  }

  const {hostedZoneName, aliasRecordName} = customDomainConfig;

  return aliasRecordName
    ? `https://${aliasRecordName}.${hostedZoneName}`
    : `https://${hostedZoneName}`;
}
