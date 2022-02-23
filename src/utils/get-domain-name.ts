export interface DomainNameParts {
  readonly hostedZoneName?: string;
  readonly aliasRecordName?: string;
}

export function getDomainName(parts: DomainNameParts): string {
  const {hostedZoneName, aliasRecordName} = parts;

  if (!hostedZoneName) {
    throw new Error(
      `The domain name cannot be inferred without a hosted zone name.`,
    );
  }

  return aliasRecordName
    ? `${aliasRecordName}.${hostedZoneName}`
    : hostedZoneName;
}
