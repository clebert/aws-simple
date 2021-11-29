import type {aws_apigateway} from 'aws-cdk-lib';
import type {S3Config, StackConfig} from '../../types';

export function createS3MethodResponses(
  stackConfig: StackConfig,
  s3Config: S3Config
): aws_apigateway.MethodResponse[] {
  const corsResponseParameters: Record<string, boolean> = stackConfig.enableCors
    ? {'method.response.header.Access-Control-Allow-Origin': true}
    : {};

  const status200ResponseParameters: Record<string, boolean> = {
    ...corsResponseParameters,
    'method.response.header.Content-Type': true,
  };

  const {responseHeaders = {}} = s3Config;

  for (const key of Object.keys(responseHeaders)) {
    status200ResponseParameters[`method.response.header.${key}`] = true;
  }

  return [
    {statusCode: '200', responseParameters: status200ResponseParameters},
    {statusCode: '404', responseParameters: corsResponseParameters},
    {statusCode: '500', responseParameters: corsResponseParameters},
  ];
}
