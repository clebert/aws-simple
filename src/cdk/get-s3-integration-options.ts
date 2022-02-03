import type {IntegrationOptions} from 'aws-cdk-lib/aws-apigateway';
import type {IRole} from 'aws-cdk-lib/aws-iam';

export interface S3IntegrationOptionsInit {
  readonly bucketReadRole: IRole;
  readonly folderProxyName: string | undefined;
  readonly responseHeaders: Readonly<Record<string, string>> | undefined;
  readonly corsEnabled: boolean | undefined;
}

export function getS3IntegrationOptions(
  init: S3IntegrationOptionsInit,
): IntegrationOptions {
  const {
    bucketReadRole,
    folderProxyName,
    responseHeaders = {},
    corsEnabled,
  } = init;

  const corsResponseParameters = corsEnabled
    ? {'method.response.header.Access-Control-Allow-Origin': `'*'`}
    : undefined;

  const responseParameters = {
    'method.response.header.Content-Type': `integration.response.header.Content-Type`,
    ...corsResponseParameters,
    ...Object.entries(responseHeaders).reduce<Record<string, string>>(
      (parameters, [key, value]) => ({
        ...parameters,
        [`method.response.header.${key}`]: `'${value}'`,
      }),
      {},
    ),
  };

  return {
    credentialsRole: bucketReadRole,
    integrationResponses: [
      {selectionPattern: `200`, statusCode: `200`, responseParameters},
      {
        selectionPattern: `404`,
        statusCode: `404`,
        responseParameters: corsResponseParameters,
      },
      {
        selectionPattern: `5\\d{2}`,
        statusCode: `500`,
        responseParameters: corsResponseParameters,
      },
    ],
    requestParameters: folderProxyName
      ? {
          [`integration.request.path.${folderProxyName}`]: `method.request.path.${folderProxyName}`,
        }
      : undefined,
    cacheKeyParameters: folderProxyName
      ? [`method.request.path.${folderProxyName}`]
      : undefined,
  };
}
