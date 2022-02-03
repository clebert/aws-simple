import type {IAuthorizer, MethodOptions} from 'aws-cdk-lib/aws-apigateway';
import {AuthorizationType} from 'aws-cdk-lib/aws-apigateway';

export interface S3MethodOptionsInit {
  readonly requestAuthorizer: IAuthorizer | undefined;
  readonly folderProxyName: string | undefined;
  readonly responseHeaders: Readonly<Record<string, string>> | undefined;
  readonly corsEnabled: boolean | undefined;
}

export function getS3MethodOptions(init: S3MethodOptionsInit): MethodOptions {
  const {
    requestAuthorizer,
    folderProxyName,
    responseHeaders = {},
    corsEnabled,
  } = init;

  const corsResponseParameters = corsEnabled
    ? {'method.response.header.Access-Control-Allow-Origin': true}
    : undefined;

  const responseParameters = {
    'method.response.header.Content-Type': true,
    ...corsResponseParameters,
    ...Object.keys(responseHeaders).reduce<Record<string, boolean>>(
      (parameters, key) => ({...parameters, [key]: true}),
      {},
    ),
  };

  return {
    authorizationType: requestAuthorizer
      ? AuthorizationType.CUSTOM
      : AuthorizationType.NONE,
    authorizer: requestAuthorizer,
    methodResponses: [
      {statusCode: `200`, responseParameters},
      {statusCode: `404`, responseParameters: corsResponseParameters},
      {statusCode: `500`, responseParameters: corsResponseParameters},
    ],
    requestParameters: folderProxyName
      ? {[`method.request.path.${folderProxyName}`]: true}
      : undefined,
  };
}
