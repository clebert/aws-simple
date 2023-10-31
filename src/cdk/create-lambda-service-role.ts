import type {Stack} from 'aws-cdk-lib';

import {aws_iam} from 'aws-cdk-lib';

export function createLambdaServiceRole(stack: Stack): aws_iam.IRole {
  return new aws_iam.Role(stack, `LambdaServiceRole`, {
    assumedBy: new aws_iam.ServicePrincipal(`lambda.amazonaws.com`),
    managedPolicies: [
      aws_iam.ManagedPolicy.fromAwsManagedPolicyName(`service-role/AWSLambdaBasicExecutionRole`),
      aws_iam.ManagedPolicy.fromAwsManagedPolicyName(`AWSXrayWriteOnlyAccess`),
    ],
  });
}
