import type {Stack} from 'aws-cdk-lib';
import type {IRole} from 'aws-cdk-lib/aws-iam';
import {Role, ServicePrincipal} from 'aws-cdk-lib/aws-iam';
import type {IBucket} from 'aws-cdk-lib/aws-s3';

export interface BucketReadRoleInit {
  readonly stack: Stack;
  readonly bucket: IBucket;
}

export function createBucketReadRole(init: BucketReadRoleInit): IRole {
  const {stack, bucket} = init;

  const role = new Role(stack, `BucketReadRole`, {
    assumedBy: new ServicePrincipal(`apigateway.amazonaws.com`),
  });

  bucket.grantRead(role);

  return role;
}
