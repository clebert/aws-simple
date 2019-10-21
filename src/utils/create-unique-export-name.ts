import {createShortHash} from './create-short-hash';

export type ExportName = 'RestApiUrl' | 'S3BucketName';

export function createUniqueExportName(
  stackName: string,
  exportName: ExportName
): string {
  return createShortHash(exportName, stackName);
}
