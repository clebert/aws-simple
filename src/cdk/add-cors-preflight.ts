import {aws_apigateway} from 'aws-cdk-lib';

export interface AddCorsPreflightOptions {
  readonly authenticationEnabled?: boolean;
}

/**
 * Because we are defining "\*\/\*" as `binaryMediaTypes` for the REST API, we
 * need to explicitly convert the request body to text, to avoid a configuration
 * error for CORS preflight requests. Since this `contentHandling` can't be
 * defined with `resource.addCorsPreflight({...})`, we need to define the
 * OPTIONS method manually instead, using the defaults that the aws-cdk would
 * also select when using `resource.addCorsPreflight()`.
 */
export function addCorsPreflight(
  resource: aws_apigateway.Resource,
  options: AddCorsPreflightOptions,
): void {
  const methodResponse: aws_apigateway.MethodResponse = {
    statusCode: `204`,
    responseParameters: {
      'method.response.header.Access-Control-Allow-Headers': true,
      'method.response.header.Access-Control-Allow-Methods': true,
      'method.response.header.Access-Control-Allow-Origin': true,
    },
  };

  const integrationResponse: aws_apigateway.IntegrationResponse = {
    statusCode: `204`,
    responseParameters: {
      'method.response.header.Access-Control-Allow-Headers': `'${aws_apigateway.Cors.DEFAULT_HEADERS}'`,
      'method.response.header.Access-Control-Allow-Methods': `'${aws_apigateway.Cors.ALL_METHODS}'`,
      'method.response.header.Access-Control-Allow-Origin': `'${aws_apigateway.Cors.ALL_ORIGINS}'`,
    },
  };

  if (options.authenticationEnabled) {
    methodResponse.responseParameters![`method.response.header.Access-Control-Allow-Credentials`] =
      true;

    integrationResponse.responseParameters![
      `method.response.header.Access-Control-Allow-Credentials`
    ] = `'true'`;
  }

  resource.addMethod(
    `OPTIONS`,
    new aws_apigateway.MockIntegration({
      requestTemplates: {'application/json': `{ statusCode: 200 }`},
      contentHandling: aws_apigateway.ContentHandling.CONVERT_TO_TEXT,
      integrationResponses: [integrationResponse],
    }),
    {methodResponses: [methodResponse]},
  );
}
