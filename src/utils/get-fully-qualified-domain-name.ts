import type {StackConfig} from '../types';

export function getFullyQualifiedDomainName(stackConfig: StackConfig): string {
  const {customDomainConfig} = stackConfig;
  const {hostedZoneName, aliasRecordName} = customDomainConfig;

  return aliasRecordName
    ? `${aliasRecordName}.${hostedZoneName}`
    : hostedZoneName;
}
