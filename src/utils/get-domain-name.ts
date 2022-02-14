export interface DomainNameParts {
  readonly hostedZoneName: string;
  readonly aliasRecordName?: string;
}

export function getDomainName(parts: DomainNameParts): string {
  const {hostedZoneName, aliasRecordName} = parts;

  return aliasRecordName
    ? `${aliasRecordName}.${hostedZoneName}`
    : hostedZoneName;
}
