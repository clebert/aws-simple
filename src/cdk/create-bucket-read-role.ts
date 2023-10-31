import type { Stack, aws_s3 } from 'aws-cdk-lib';

import { aws_iam } from 'aws-cdk-lib';

export function createBucketReadRole(stack: Stack, bucket: aws_s3.IBucket): aws_iam.IRole {
  const role = new aws_iam.Role(stack, `BucketReadRole`, {
    assumedBy: new aws_iam.ServicePrincipal(`apigateway.amazonaws.com`),
  });

  bucket.grantRead(role);

  return role;
}
