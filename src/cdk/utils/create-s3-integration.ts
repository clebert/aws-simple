import * as path from 'path';
import type {aws_iam, aws_s3} from 'aws-cdk-lib';
import {aws_apigateway} from 'aws-cdk-lib';
import type {S3Config, StackConfig} from '../../types';
import {createS3IntegrationResponses} from './create-s3-integration-responses';
import {createS3MethodResponses} from './create-s3-method-responses';

export function createS3Integration(
  stackConfig: StackConfig,
  restApi: aws_apigateway.RestApi,
  s3Bucket: aws_s3.Bucket,
  s3IntegrationRole: aws_iam.Role,
  s3Config: S3Config,
  authorizer: aws_apigateway.IAuthorizer | undefined
): void {
  const {
    type,
    publicPath,
    bucketPath = publicPath,
    authenticationRequired,
  } = s3Config;

  if (authenticationRequired && !authorizer) {
    throw new Error(
      `The S3 config for "${publicPath}" requires authentication but no basicAuthenticationConfig has been defined.`
    );
  }

  const s3Integration = new aws_apigateway.AwsIntegration({
    service: 's3',
    path: path.join(
      s3Bucket.bucketName,
      bucketPath,
      ...(type === 'folder' ? ['{file}'] : [])
    ),
    integrationHttpMethod: 'GET',
    options: {
      credentialsRole: s3IntegrationRole,
      integrationResponses: createS3IntegrationResponses(stackConfig, s3Config),
      requestParameters:
        type === 'folder'
          ? {'integration.request.path.file': 'method.request.path.file'}
          : {},
      cacheKeyParameters: type === 'folder' ? ['method.request.path.file'] : [],
    },
  });

  let resource = restApi.root.resourceForPath(publicPath);

  if (type === 'folder') {
    resource = resource.addResource('{file}');
  }

  resource.addMethod('GET', s3Integration, {
    authorizationType: authenticationRequired
      ? aws_apigateway.AuthorizationType.CUSTOM
      : aws_apigateway.AuthorizationType.NONE,
    authorizer: authenticationRequired ? authorizer : undefined,
    methodResponses: createS3MethodResponses(stackConfig, s3Config),
    requestParameters: {'method.request.path.file': type === 'folder'},
  });
}
