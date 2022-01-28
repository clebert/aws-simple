import type {StackConfig} from '../types';

export function createStackBaseUrl(stackConfig: StackConfig): string {
  const {customDomainConfig} = stackConfig;
  const {hostedZoneName, aliasRecordName} = customDomainConfig;

  return aliasRecordName
    ? `https://${aliasRecordName}.${hostedZoneName}`
    : `https://${hostedZoneName}`;
}
