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
import {createShortHash} from '../utils/create-short-hash';
import {createUniqueExportName} from '../utils/create-unique-export-name';
import {createStackName} from '../utils/stack-name';
import {createARecord} from './utils/create-a-record';
import {createLambdaIntegration} from './utils/create-lambda-integration';
import {createRestApiProps} from './utils/create-rest-api-props';
import {createS3Integration} from './utils/create-s3-integration';

export function createStack(appConfig: AppConfig): void {
  const resourceName = `${appConfig.appName} ${appConfig.appVersion}`;
  const stackConfig = appConfig.createStackConfig();
  const stack = new Stack(new App(), createStackName(appConfig));

  const restApi = new RestApi(
    stack,
    createShortHash('RestApi'),
    createRestApiProps(resourceName, stackConfig, stack)
  );

  const restApiUrlOutput = new CfnOutput(
    stack,
    createShortHash('RestApiUrlOutput'),
    {
      value: restApi.url,
      exportName: createUniqueExportName(stack.stackName, 'RestApiUrl')
    }
  );

  restApiUrlOutput.node.addDependency(restApi);

  createARecord(stackConfig, stack, restApi);

  const s3Bucket = new Bucket(stack, createShortHash('S3Bucket'), {
    bucketName: resourceName,
    publicReadAccess: false
  });

  const s3BucketNameOutput = new CfnOutput(
    stack,
    createShortHash('S3BucketNameOutput'),
    {
      value: s3Bucket.bucketName,
      exportName: createUniqueExportName(stack.stackName, 'S3BucketName')
    }
  );

  s3BucketNameOutput.node.addDependency(s3Bucket);

  const s3IntegrationRole = new Role(
    stack,
    createShortHash('S3IntegrationRole'),
    {
      roleName: resourceName,
      assumedBy: new ServicePrincipal('apigateway.amazonaws.com')
    }
  );

  const s3IntegrationPolicy = new Policy(
    stack,
    createShortHash('S3IntegrationPolicy'),
    {
      policyName: resourceName,
      statements: [new PolicyStatement({actions: ['s3:*'], resources: ['*']})],
      roles: [s3IntegrationRole]
    }
  );

  s3IntegrationPolicy.node.addDependency(s3IntegrationRole);

  const {lambdaConfigs = [], s3Configs = []} = stackConfig;

  for (const lambdaConfig of lambdaConfigs) {
    createLambdaIntegration(resourceName, stack, restApi, lambdaConfig);
  }

  for (const s3Config of s3Configs) {
    createS3Integration(restApi, s3Bucket, s3IntegrationRole, s3Config);
  }
}
