import {
  App,
  CfnOutput,
  RemovalPolicy,
  Stack,
  aws_apigateway,
  aws_iam,
  aws_s3,
  aws_wafv2,
} from 'aws-cdk-lib';
import type {AppConfig} from '../types';
import {createUniqueExportName} from '../utils/create-unique-export-name';
import {createStackName} from '../utils/stack-name';
import {createBasicAuthorizer} from './utils/create-basic-authorizer';
import {createLambdaIntegration} from './utils/create-lambda-integration';
import {createRecord} from './utils/create-record';
import {createRestApiProps} from './utils/create-rest-api-props';
import {createS3Integration} from './utils/create-s3-integration';
import {createUnauthorizedGatewayResponse} from './utils/create-unauthorized-gateway-response';

export function createStack(appConfig: AppConfig): void {
  const {appName, appVersion, createStackConfig} = appConfig;
  const stackConfig = createStackConfig();
  const stack = new Stack(new App(), createStackName(appConfig));

  const restApi = new aws_apigateway.RestApi(
    stack,
    `RestApi`,
    createRestApiProps(`${appName} ${appVersion}`, stackConfig, stack),
  );

  const restApiIdOutput = new CfnOutput(stack, `RestApiIdOutput`, {
    value: restApi.restApiId,
    exportName: createUniqueExportName(stack.stackName, `RestApiId`),
  });

  restApiIdOutput.node.addDependency(restApi);

  if (stackConfig.webAclArn) {
    const webAclAssociation = new aws_wafv2.CfnWebACLAssociation(
      stack,
      `WebACLAssociation`,
      {
        // https://docs.aws.amazon.com/apigateway/latest/developerguide/arn-format-reference.html
        resourceArn: `arn:aws:apigateway:${stack.region}::/restapis/${restApi.restApiId}/stages/prod`,
        webAclArn: stackConfig.webAclArn,
      },
    );

    webAclAssociation.node.addDependency(restApi);
  }

  createRecord(stackConfig, stack, restApi, `a`);
  createRecord(stackConfig, stack, restApi, `aaaa`);
  createUnauthorizedGatewayResponse(stackConfig, stack, restApi);

  const s3Bucket = new aws_s3.Bucket(stack, `S3Bucket`, {
    blockPublicAccess: aws_s3.BlockPublicAccess.BLOCK_ALL,
    encryption: aws_s3.BucketEncryption.S3_MANAGED,
    enforceSSL: true,
    removalPolicy: RemovalPolicy.DESTROY,
    autoDeleteObjects: true,
  });

  const s3BucketNameOutput = new CfnOutput(stack, `S3BucketNameOutput`, {
    value: s3Bucket.bucketName,
    exportName: createUniqueExportName(stack.stackName, `S3BucketName`),
  });

  s3BucketNameOutput.node.addDependency(s3Bucket);

  const s3IntegrationRole = new aws_iam.Role(stack, `S3IntegrationRole`, {
    assumedBy: new aws_iam.ServicePrincipal(`apigateway.amazonaws.com`),
  });

  const s3IntegrationPolicy = new aws_iam.Policy(stack, `S3IntegrationPolicy`, {
    statements: [
      new aws_iam.PolicyStatement({actions: [`s3:*`], resources: [`*`]}),
    ],
    roles: [s3IntegrationRole],
  });

  s3IntegrationPolicy.node.addDependency(s3IntegrationRole);

  const authorizer = createBasicAuthorizer(
    appName,
    appVersion,
    stackConfig,
    stack,
  );

  const {lambdaConfigs = [], s3Configs = []} = stackConfig;

  for (const lambdaConfig of lambdaConfigs) {
    createLambdaIntegration(stack, restApi, lambdaConfig, authorizer);
  }

  for (const s3Config of s3Configs) {
    createS3Integration(
      stackConfig,
      restApi,
      s3Bucket,
      s3IntegrationRole,
      s3Config,
      authorizer,
    );
  }
}
