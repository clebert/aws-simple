import type {CloudFormation} from 'aws-sdk';
import {S3} from 'aws-sdk';

export async function deleteS3Bucket(
  clientConfig: CloudFormation.ClientConfiguration,
  s3BucketName: string
): Promise<void> {
  const s3 = new S3(clientConfig);

  const {Contents = []} = await s3
    .listObjects({Bucket: s3BucketName})
    .promise();

  const objectIdentifiers = Contents.filter(
    (object): object is S3.ObjectIdentifier => typeof object.Key === 'string'
  ).map(({Key}) => ({Key}));

  if (objectIdentifiers.length > 0) {
    await s3
      .deleteObjects({
        Bucket: s3BucketName,
        Delete: {Objects: objectIdentifiers},
      })
      .promise();
  }

  await s3.deleteBucket({Bucket: s3BucketName}).promise();
}
