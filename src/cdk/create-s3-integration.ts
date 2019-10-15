import {AuthorizationType, AwsIntegration} from '@aws-cdk/aws-apigateway';
import * as path from 'path';
import {S3Config} from '../types';
import {Resources} from './create-resources';
import {createS3IntegrationResponses} from './utils/create-s3-integration-responses';
import {createS3MethodResponses} from './utils/create-s3-method-responses';

export function createS3Integration(
  resources: Resources,
  s3Config: S3Config
): void {
  const {restApi, s3Bucket, s3IntegrationRole} = resources;
  const {type, publicPath, bucketPath = publicPath} = s3Config;

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
      integrationResponses: createS3IntegrationResponses(s3Config),
      requestParameters:
        type === 'folder'
          ? {'integration.request.path.file': 'method.request.path.file'}
          : {}
    }
  });

  let resource = restApi.root.resourceForPath(publicPath);

  if (type === 'folder') {
    resource = resource.addResource('{file}');
  }

  resource.addMethod('GET', s3Integration, {
    authorizationType: AuthorizationType.NONE,
    methodResponses: createS3MethodResponses(s3Config),
    requestParameters: {'method.request.path.file': type === 'folder'}
  });
}
