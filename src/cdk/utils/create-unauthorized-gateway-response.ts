import {RestApi, CfnGatewayResponse} from '@aws-cdk/aws-apigateway';
import {Stack} from '@aws-cdk/core';
import {StackConfig} from '../../types';

export function createUnauthorizedGatewayResponse(
  stackConfig: StackConfig,
  stack: Stack,
  restApi: RestApi
): void {
  const {basicAuthentication} = stackConfig;

  if (!basicAuthentication) {
    return;
  }

  const {realm} = basicAuthentication;

  // We need to use a low-level construct here that should be replaced when
  // @aws-cdk/aws-apigateway adds a high-level construct for gateway responses.
  new CfnGatewayResponse(stack, 'ApiGatewayUnauthorizedResponse', {
    statusCode: '401',
    responseType: 'UNAUTHORIZED',
    restApiId: restApi.restApiId,
    responseParameters: {
      'gatewayresponse.header.WWW-Authenticate': realm
        ? `'Basic realm="${realm}"'`
        : "'Basic'"
    },
    responseTemplates: {
      'application/json': '{"message":$context.error.messageString}'
    }
  });

  // Intentionally not adding the restApi as a dependency here, otherwise the
  // gateway response would only be active after a manual deployment.
}
