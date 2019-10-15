import {IntegrationResponse} from '@aws-cdk/aws-apigateway';
import {S3Config} from '../../types';

export function createS3IntegrationResponses(
  s3Config: S3Config
): IntegrationResponse[] {
  const s3IntegrationResponseParameters: Record<string, string> = {
    'method.response.header.Content-Type':
      'integration.response.header.Content-Type'
  };

  const {responseHeaders} = s3Config;

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

  return [
    {
      selectionPattern: '200',
      statusCode: '200',
      responseParameters: s3IntegrationResponseParameters
    },
    {selectionPattern: '404', statusCode: '404'},
    {selectionPattern: '5d{2}', statusCode: '500'}
  ];
}
