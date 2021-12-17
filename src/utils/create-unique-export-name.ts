import {createShortHash} from './create-short-hash';

export type ExportName = 'RestApiId' | 'RestApiUrl' | 'S3BucketName';

export function createUniqueExportName(
  stackName: string,
  exportName: ExportName,
  legacy: boolean = false,
): string {
  return legacy
    ? `R${createShortHash(exportName, stackName)}`
    : `${exportName}${createShortHash(stackName)}`;
}
