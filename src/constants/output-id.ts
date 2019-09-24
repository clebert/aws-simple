function createOutputIdFactory(
  exportName: string
): (stackId: string) => string {
  return stackId => `${stackId}-output-${exportName}`;
}

export const OutputId = {
  forRestApiUrl: createOutputIdFactory('rest-api-url'),
  forS3BucketName: createOutputIdFactory('s3-bucket-name')
};
