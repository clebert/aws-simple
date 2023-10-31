import { z } from 'zod';

export type DomainNameParts = z.TypeOf<typeof DomainNamePartsSchema>;

export const DomainNamePartsSchema = z.object({
  hostedZoneName: z.string().optional(),
  aliasRecordName: z.string().optional(),
});

export function parseDomainNameParts(config: unknown): DomainNameParts {
  return DomainNamePartsSchema.parse(config);
}
