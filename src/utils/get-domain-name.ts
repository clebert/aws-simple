import type {DomainNameParts} from '../parse-domain-name-parts.js';

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
