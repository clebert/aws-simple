function createResourceIdFactory(
  resourceName: string
): (stackId: string, resourceNameSuffix?: string) => string {
  return (stackId, resourceNameSuffix = '') =>
    `${stackId}-resource-${resourceName}${resourceNameSuffix}`;
}

export const ResourceId = {
  forARecord: createResourceIdFactory('a-record'),
  forCertificate: createResourceIdFactory('certificate'),
  forLambda: createResourceIdFactory('lambda'),
  forRestApi: createResourceIdFactory('rest-api'),
  forRestApiUrlOutput: createResourceIdFactory('rest-api-url-output'),
  forS3Bucket: createResourceIdFactory('s3-bucket'),
  forS3BucketNameOutput: createResourceIdFactory('s3-bucket-name-output'),
  forS3IntegrationPolicy: createResourceIdFactory('s3-integration-policy'),
  forS3IntegrationRole: createResourceIdFactory('s3-integration-role'),
  forStack: createResourceIdFactory('stack'),
  forZone: createResourceIdFactory('zone')
};
