import {
  AuthorizationType,
  AwsIntegration,
  IAuthorizer,
  RestApi,
} from '@aws-cdk/aws-apigateway';
import {Role} from '@aws-cdk/aws-iam';
import {Bucket} from '@aws-cdk/aws-s3';
import * as path from 'path';
import {S3Config, StackConfig} from '../../types';
import {createS3IntegrationResponses} from './create-s3-integration-responses';
import {createS3MethodResponses} from './create-s3-method-responses';

export function createS3Integration(
  stackConfig: StackConfig,
  restApi: RestApi,
  s3Bucket: Bucket,
  s3IntegrationRole: Role,
  s3Config: S3Config,
  authorizer: IAuthorizer | undefined
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

  const s3Integration = new AwsIntegration({
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
      ? AuthorizationType.CUSTOM
      : AuthorizationType.NONE,
    authorizer: authenticationRequired ? authorizer : undefined,
    methodResponses: createS3MethodResponses(stackConfig, s3Config),
    requestParameters: {'method.request.path.file': type === 'folder'},
  });
}
