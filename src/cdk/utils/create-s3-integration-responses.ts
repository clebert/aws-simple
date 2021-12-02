import {aws_apigateway} from 'aws-cdk-lib';
import type {S3Config, StackConfig} from '../../types';

export function createS3IntegrationResponses(
  stackConfig: StackConfig,
  s3Config: S3Config
): aws_apigateway.IntegrationResponse[] {
  const corsResponseParameters: Record<string, string> = stackConfig.enableCors
    ? {'method.response.header.Access-Control-Allow-Origin': `'*'`}
    : {};

  const status200ResponseParameters: Record<string, string> = {
    ...corsResponseParameters,
    'method.response.header.Content-Type': `integration.response.header.Content-Type`,
  };

  const {responseHeaders = {}} = s3Config;

  for (const [key, value] of Object.entries(responseHeaders)) {
    status200ResponseParameters[`method.response.header.${key}`] = `'${value}'`;
  }

  return [
    {
      selectionPattern: `200`,
      statusCode: `200`,
      responseParameters: status200ResponseParameters,
      contentHandling: s3Config.binary
        ? aws_apigateway.ContentHandling.CONVERT_TO_BINARY
        : undefined,
    },
    {
      selectionPattern: `404`,
      statusCode: `404`,
      responseParameters: corsResponseParameters,
    },
    {
      selectionPattern: `5d{2}`,
      statusCode: `500`,
      responseParameters: corsResponseParameters,
    },
  ];
}
