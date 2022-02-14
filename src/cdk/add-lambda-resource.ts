import type {Stack, aws_lambda} from 'aws-cdk-lib';
import {aws_apigateway} from 'aws-cdk-lib';
import type {LambdaRoute, StackConfig} from '../read-stack-config';
import {createLambdaFunction} from './create-lambda-function';

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

  const corsOptions: aws_apigateway.CorsOptions = {
    allowOrigins: aws_apigateway.Cors.ALL_ORIGINS,
    allowCredentials: authenticationEnabled,
  };

  const methodOptions: aws_apigateway.MethodOptions = {
    authorizationType: authenticationEnabled
      ? aws_apigateway.AuthorizationType.CUSTOM
      : aws_apigateway.AuthorizationType.NONE,
    authorizer: requestAuthorizer,
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
    resource.addCorsPreflight(corsOptions);
  }

  resource.addMethod(httpMethod, integration, methodOptions);

  if (publicPath.endsWith(`/*`)) {
    const proxyResource = restApi.root.resourceForPath(
      publicPath.replace(`/*`, `/{proxy+}`),
    );

    if (corsEnabled) {
      proxyResource.addCorsPreflight(corsOptions);
    }

    proxyResource.addMethod(httpMethod, integration, methodOptions);
  }

  return lambdaFunction;
}
