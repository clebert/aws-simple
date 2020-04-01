import {ContentHandling, IntegrationResponse} from '@aws-cdk/aws-apigateway';
import mimeTypes from 'mime-types';
import {S3FileConfig, StackConfig} from '../../types';

export function createS3IntegrationResponses(
  stackConfig: StackConfig,
  s3FileConfig: S3FileConfig
): IntegrationResponse[] {
  const corsResponseParameters: Record<string, string> = stackConfig.enableCors
    ? {'method.response.header.Access-Control-Allow-Origin': "'*'"}
    : {};

  const status200ResponseParameters: Record<string, string> = {
    ...corsResponseParameters,
    'method.response.header.Content-Type':
      'integration.response.header.Content-Type',
  };

  const {responseHeaders} = s3FileConfig;

  if (responseHeaders) {
    const {cacheControl} = responseHeaders;

    if (cacheControl) {
      status200ResponseParameters[
        'method.response.header.Cache-Control'
      ] = `'${cacheControl}'`;
    }
  }

  const mediaType = mimeTypes.lookup(s3FileConfig.localPath);

  return [
    {
      selectionPattern: '200',
      statusCode: '200',
      responseParameters: status200ResponseParameters,
      contentHandling:
        mediaType && stackConfig.binaryMediaTypes?.includes(mediaType)
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
