import {CloudFormation} from 'aws-sdk';
import {AppConfig} from '../types';
import {findStackOutput} from './find-stack-output';

export function createStackBaseUrl(
  appConfig: AppConfig,
  stack: CloudFormation.Stack
): string {
  const {customDomainConfig} = appConfig;

  if (!customDomainConfig) {
    return findStackOutput(stack, 'restApiUrl');
  }

  const {hostedZoneName, aliasRecordName} = customDomainConfig;

  return aliasRecordName
    ? `https://${aliasRecordName}.${hostedZoneName}`
    : `https://${hostedZoneName}`;
}
