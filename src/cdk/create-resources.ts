import {RestApi} from '@aws-cdk/aws-apigateway';
import {
  Policy,
  PolicyStatement,
  Role,
  ServicePrincipal
} from '@aws-cdk/aws-iam';
import {Bucket} from '@aws-cdk/aws-s3';
import {App, CfnOutput, Stack} from '@aws-cdk/core';
import {AppConfig} from '../types';
import {createStackName} from '../utils/stack-name';
import {createARecord} from './utils/create-a-record';
import {createRestApiProps} from './utils/create-rest-api-props';

export type ExportName = 'restApiUrl' | 's3BucketName';

export interface Resources {
  readonly stack: Stack;
  readonly restApi: RestApi;
  readonly s3Bucket: Bucket;
  readonly s3IntegrationRole: Role;
}

export function createResources(appConfig: AppConfig): Resources {
  const stack = new Stack(new App(), createStackName(appConfig));

  const restApi = new RestApi(
    stack,
    'RestApi',
    createRestApiProps(appConfig, stack)
  );

  const restApiUrlExportName: ExportName = 'restApiUrl';

  const restApiUrlOutput = new CfnOutput(stack, 'RestApiUrlOutput', {
    value: restApi.url,
    exportName: restApiUrlExportName
  });

  restApiUrlOutput.node.addDependency(restApi);

  createARecord(appConfig, stack, restApi);

  const s3Bucket = new Bucket(stack, 'S3Bucket', {publicReadAccess: false});
  const s3BucketNameExportName: ExportName = 's3BucketName';

  const s3BucketNameOutput = new CfnOutput(stack, 'S3BucketNameOutput', {
    value: s3Bucket.bucketName,
    exportName: s3BucketNameExportName
  });

  s3BucketNameOutput.node.addDependency(s3Bucket);

  const s3IntegrationRole = new Role(stack, 'S3IntegrationRole', {
    assumedBy: new ServicePrincipal('apigateway.amazonaws.com')
  });

  const s3IntegrationPolicy = new Policy(stack, 'S3IntegrationPolicy', {
    statements: [new PolicyStatement({actions: ['s3:*'], resources: ['*']})],
    roles: [s3IntegrationRole]
  });

  s3IntegrationPolicy.node.addDependency(s3IntegrationRole);

  return {stack, restApi, s3Bucket, s3IntegrationRole};
}
