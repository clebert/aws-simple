import {MethodResponse} from '@aws-cdk/aws-apigateway';
import {S3Config, StackConfig} from '../../types';

export function createS3MethodResponses(
  stackConfig: StackConfig,
  s3Config: S3Config
): MethodResponse[] {
  const s3MethodResponseParameters: Record<string, boolean> = {
    'method.response.header.Content-Type': true,
  };

  if (stackConfig.enableCors) {
    s3MethodResponseParameters[
      'method.response.header.Access-Control-Allow-Origin'
    ] = true;
  }

  const {responseHeaders} = s3Config;

  if (responseHeaders) {
    const {cacheControl} = responseHeaders;

    if (cacheControl) {
      s3MethodResponseParameters['method.response.header.Cache-Control'] = true;
    }
  }

  return [
    {statusCode: '200', responseParameters: s3MethodResponseParameters},
    {statusCode: '404'},
    {statusCode: '500'},
  ];
}
