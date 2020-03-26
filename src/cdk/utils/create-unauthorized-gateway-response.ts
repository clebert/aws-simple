import {RestApi, CfnGatewayResponse} from '@aws-cdk/aws-apigateway';
import {Stack} from '@aws-cdk/core';
import {StackConfig} from '../../types';

export function createUnauthorizedGatewayResponse(
  stackConfig: StackConfig,
  stack: Stack,
  restApi: RestApi
): void {
  if (!stackConfig.basicAuthenticationConfig) {
    return;
  }

  // We need to use a low-level construct here that should be replaced when
  // @aws-cdk/aws-apigateway adds a high-level construct for gateway responses.
  new CfnGatewayResponse(stack, 'ApiGatewayUnauthorizedResponse', {
    statusCode: '401',
    responseType: 'UNAUTHORIZED',
    restApiId: restApi.restApiId,
    responseParameters: {'gatewayresponse.header.WWW-Authenticate': "'Basic'"},
    responseTemplates: {
      'application/json': '{"message":$context.error.messageString}',
      'text/html': '$context.error.message'
    }
  });

  // Intentionally not adding the restApi as a dependency here. With a defined
  // dependency the api gateway would be deployed first, and only afterwards the
  // gateway response would be added. This would require an additional
  // deployment. We don't really need the dependency, since we are only
  // interested in the restApiId (see above), which can be computed beforehand.
  // Omitting the dependency allows the CDK to deploy the api gateway already
  // with the gateway response defined, so that no additional deployment would
  // be needed.
}
