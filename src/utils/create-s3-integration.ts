import {
  AuthorizationType,
  AwsIntegration,
  IntegrationResponse,
  MethodResponse
} from '@aws-cdk/aws-apigateway';
import * as path from 'path';
import {Resources, S3Config} from '..';

export function createS3Integration(
  resources: Resources,
  s3Config: S3Config
): void {
  const {restApi, s3Bucket, s3IntegrationRole} = resources;
  const {type, publicPath, bucketPath = publicPath, responseHeaders} = s3Config;

  const s3IntegrationResponseParameters: Record<string, string> = {
    'method.response.header.Content-Type':
      'integration.response.header.Content-Type'
  };

  if (responseHeaders) {
    const {accessControlAllowOrigin, cacheControl} = responseHeaders;

    if (accessControlAllowOrigin) {
      s3IntegrationResponseParameters[
        'method.response.header.Access-Control-Allow-Origin'
      ] = `'${accessControlAllowOrigin}'`;
    }

    if (cacheControl) {
      s3IntegrationResponseParameters[
        'method.response.header.Cache-Control'
      ] = `'${cacheControl}'`;
    }
  }

  const s3IntegrationResponses: IntegrationResponse[] = [
    {
      selectionPattern: '200',
      statusCode: '200',
      responseParameters: s3IntegrationResponseParameters
    },
    {selectionPattern: '404', statusCode: '404'},
    {selectionPattern: '5d{2}', statusCode: '500'}
  ];

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
      integrationResponses: s3IntegrationResponses,
      requestParameters:
        type === 'folder'
          ? {'integration.request.path.file': 'method.request.path.file'}
          : {}
    }
  });

  const s3MethodResponseParameters: Record<string, boolean> = {
    'method.response.header.Content-Type': true
  };

  if (responseHeaders) {
    const {accessControlAllowOrigin, cacheControl} = responseHeaders;

    if (accessControlAllowOrigin) {
      s3MethodResponseParameters[
        'method.response.header.Access-Control-Allow-Origin'
      ] = true;
    }

    if (cacheControl) {
      s3MethodResponseParameters['method.response.header.Cache-Control'] = true;
    }
  }

  const s3MethodResponses: MethodResponse[] = [
    {statusCode: '200', responseParameters: s3MethodResponseParameters},
    {statusCode: '404'},
    {statusCode: '500'}
  ];

  let resource = restApi.root.resourceForPath(publicPath);

  if (type === 'folder') {
    resource = resource.addResource('{file}');
  }

  resource.addMethod('GET', s3Integration, {
    authorizationType: AuthorizationType.NONE,
    methodResponses: s3MethodResponses,
    requestParameters: {'method.request.path.file': type === 'folder'}
  });
}
