import type {IGatewayResponse, RestApiBase} from 'aws-cdk-lib/aws-apigateway';
import {GatewayResponse, ResponseType} from 'aws-cdk-lib/aws-apigateway';
import type {Stack} from 'aws-cdk-lib/core';

export interface UnauthorizedGatewayResponseInit {
  readonly stack: Stack;
  readonly restApi: RestApiBase;
  readonly realm: string | undefined;
  readonly corsEnabled: boolean | undefined;
}

export function createUnauthorizedGatewayResponse(
  init: UnauthorizedGatewayResponseInit,
): IGatewayResponse {
  const {stack, restApi, realm, corsEnabled} = init;

  const corsResponseHeaders: Record<string, string> = corsEnabled
    ? {
        'gatewayresponse.header.Access-Control-Allow-Origin': `method.request.header.origin`,
        'gatewayresponse.header.Access-Control-Allow-Credentials': `'true'`,
        'gatewayresponse.header.Access-Control-Allow-Headers': `'Authorization,*'`,
      }
    : {};

  return new GatewayResponse(stack, `UnauthorizedGatewayResponse`, {
    restApi,
    type: ResponseType.UNAUTHORIZED,
    responseHeaders: {
      'gatewayresponse.header.WWW-Authenticate': realm
        ? `'Basic realm=${realm}'`
        : `'Basic'`,
      ...corsResponseHeaders,
    },
    templates: {
      'application/json': `{"message":$context.error.messageString}`,
      'text/html': `$context.error.message`,
    },
  });
}
