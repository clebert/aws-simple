import {CloudFormation, S3} from 'aws-sdk';
import {findStackOutput} from './find-stack-output';

export async function deleteS3Bucket(
  clientConfig: CloudFormation.ClientConfiguration,
  stack: CloudFormation.Stack
): Promise<void> {
  const s3 = new S3(clientConfig);
  const s3BucketName = findStackOutput(stack, 's3BucketName');

  const {Contents = []} = await s3
    .listObjects({Bucket: s3BucketName})
    .promise();

  const objectIdentifiers = Contents.filter(
    ({Key}) => typeof Key === 'string'
  ).map(({Key}) => ({Key} as S3.ObjectIdentifier));

  await s3
    .deleteObjects({Bucket: s3BucketName, Delete: {Objects: objectIdentifiers}})
    .promise();

  await s3.deleteBucket({Bucket: s3BucketName}).promise();
}
