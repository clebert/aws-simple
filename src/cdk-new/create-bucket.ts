import type {IBucket} from 'aws-cdk-lib/aws-s3';
import {BlockPublicAccess, Bucket, BucketEncryption} from 'aws-cdk-lib/aws-s3';
import type {Stack} from 'aws-cdk-lib/core';
import {CfnOutput, RemovalPolicy} from 'aws-cdk-lib/core';

export interface BucketInit {
  readonly stack: Stack;
}

export function createBucket(init: BucketInit): IBucket {
  const {stack} = init;

  const bucket = new Bucket(stack, `Bucket`, {
    blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    encryption: BucketEncryption.S3_MANAGED,
    enforceSSL: true,
    removalPolicy: RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
  });

  new CfnOutput(stack, `BucketNameOutput`, {
    value: bucket.bucketName,
  }).node.addDependency(bucket);

  return bucket;
}
