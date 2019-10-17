export type ExportName = 'RestApiUrl' | 'S3BucketName';

export function createUniqueExportName(
  stackName: string,
  exportName: ExportName
): string {
  return `${exportName}--${stackName}`;
}
