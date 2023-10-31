import type { Stack } from 'aws-cdk-lib';

import { CfnOutput, RemovalPolicy, aws_s3 } from 'aws-cdk-lib';

export function createBucket(stack: Stack): aws_s3.IBucket {
  const bucket = new aws_s3.Bucket(stack, `Bucket`, {
    blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
    encryption: aws_s3.BucketEncryption.S3_MANAGED,
    enforceSSL: true,
    removalPolicy: RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
    objectOwnership: aws_s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
  });

  new CfnOutput(stack, `BucketNameOutput`, {
    value: bucket.bucketName,
  }).node.addDependency(bucket);

  return bucket;
}
