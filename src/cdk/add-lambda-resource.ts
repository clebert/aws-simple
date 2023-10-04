import type {LambdaRoute, StackConfig} from '../parse-stack-config.js';
import type {Stack, aws_lambda} from 'aws-cdk-lib';

import {addCorsPreflight} from './add-cors-preflight.js';
import {createLambdaFunction} from './create-lambda-function.js';
import {aws_apigateway} from 'aws-cdk-lib';

export function addLambdaResource(
  stackConfig: StackConfig,
  route: LambdaRoute,
  stack: Stack,
  restApi: aws_apigateway.RestApiBase,
  requestAuthorizer: aws_apigateway.IAuthorizer | undefined,
): aws_lambda.FunctionBase {
  const {
    httpMethod,
    publicPath,
    requestParameters,
    authenticationEnabled,
    corsEnabled,
  } = route;

  if (authenticationEnabled && !requestAuthorizer) {
    throw new Error(
      `Authentication cannot be enabled because no authentication options are configured.`,
    );
  }

  const cacheKeyParameters = Object.entries(requestParameters ?? {})
    .filter(([, {cacheKey}]) => cacheKey)
    .map(([parameterName]) => `method.request.querystring.${parameterName}`);

  const lambdaFunction = createLambdaFunction(stackConfig, route, stack);

  const integration = new aws_apigateway.LambdaIntegration(lambdaFunction, {
    cacheKeyParameters,
  });

  const methodOptions: aws_apigateway.MethodOptions = {
    authorizationType: authenticationEnabled
      ? aws_apigateway.AuthorizationType.CUSTOM
      : aws_apigateway.AuthorizationType.NONE,
    authorizer: authenticationEnabled ? requestAuthorizer : undefined,
    requestParameters: Object.entries(requestParameters ?? {}).reduce(
      (parameters, [parameterName, {required = false}]) => ({
        ...parameters,
        [`method.request.querystring.${parameterName}`]: required,
      }),
      {} as Record<string, boolean>,
    ),
  };

  const resource = restApi.root.resourceForPath(publicPath.replace(`/*`, `/`));

  if (corsEnabled) {
    addCorsPreflight(resource, {authenticationEnabled});
  }

  resource.addMethod(httpMethod, integration, methodOptions);

  if (publicPath.endsWith(`/*`)) {
    const proxyResource = restApi.root.resourceForPath(
      publicPath.replace(`/*`, `/{proxy+}`),
    );

    if (corsEnabled) {
      addCorsPreflight(proxyResource, {authenticationEnabled});
    }

    proxyResource.addMethod(httpMethod, integration, methodOptions);
  }

  return lambdaFunction;
}
