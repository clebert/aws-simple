import type {StackConfig} from '../get-stack-config';

export function getDomainName(stackConfig: StackConfig): string {
  const {hostedZoneName, aliasRecordName} = stackConfig;

  return aliasRecordName
    ? `${aliasRecordName}.${hostedZoneName}`
    : hostedZoneName;
}
