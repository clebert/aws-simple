import {ContentHandling, IntegrationResponse} from '@aws-cdk/aws-apigateway';
import {S3Config, StackConfig} from '../../types';

export function createS3IntegrationResponses(
  stackConfig: StackConfig,
  s3Config: S3Config
): IntegrationResponse[] {
  const corsResponseParameters: Record<string, string> = stackConfig.enableCors
    ? {'method.response.header.Access-Control-Allow-Origin': "'*'"}
    : {};

  const status200ResponseParameters: Record<string, string> = {
    ...corsResponseParameters,
    'method.response.header.Content-Type':
      'integration.response.header.Content-Type',
  };

  const {responseHeaders} = s3Config;

  if (responseHeaders) {
    const {cacheControl} = responseHeaders;

    if (cacheControl) {
      status200ResponseParameters[
        'method.response.header.Cache-Control'
      ] = `'${cacheControl}'`;
    }
  }

  return [
    {
      selectionPattern: '200',
      statusCode: '200',
      responseParameters: status200ResponseParameters,
      contentHandling: s3Config.binary
        ? ContentHandling.CONVERT_TO_BINARY
        : undefined,
    },
    {
      selectionPattern: '404',
      statusCode: '404',
      responseParameters: corsResponseParameters,
    },
    {
      selectionPattern: '5d{2}',
      statusCode: '500',
      responseParameters: corsResponseParameters,
    },
  ];
}
