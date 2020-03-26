import {
  AuthorizationType,
  IAuthorizer,
  LambdaIntegration,
  RestApi
} from '@aws-cdk/aws-apigateway';
import {Code, Function as Lambda, Runtime} from '@aws-cdk/aws-lambda';
import {Duration, Stack} from '@aws-cdk/core';
import * as path from 'path';
import {LambdaConfig} from '../../types';
import {createShortHash} from '../../utils/create-short-hash';

export function createLambdaIntegration(
  stack: Stack,
  restApi: RestApi,
  lambdaConfig: LambdaConfig,
  authorizer?: IAuthorizer
): void {
  const {
    httpMethod,
    publicPath,
    localPath,
    description,
    handler = 'handler',
    memorySize = 3008,
    timeoutInSeconds = 28,
    acceptedParameters = {},
    environment,
    authenticationRequired
  } = lambdaConfig;

  if (timeoutInSeconds > 28) {
    console.warn(
      'Due to the default timeout of the API Gateway, the maximum Lambda timeout is limited to 28 seconds.'
    );
  }

  if (authenticationRequired && !authorizer) {
    throw new Error(
      `The Lambda config for "${httpMethod} ${publicPath}" requires authentication but no basicAuthenticationConfig has been defined.`
    );
  }

  restApi.root.resourceForPath(publicPath).addMethod(
    httpMethod,
    new LambdaIntegration(
      new Lambda(stack, `Lambda${httpMethod}${createShortHash(publicPath)}`, {
        description,
        runtime: Runtime.NODEJS_10_X,
        code: Code.fromAsset(path.dirname(localPath)),
        handler: `${path.basename(
          localPath,
          path.extname(localPath)
        )}.${handler}`,
        timeout: Duration.seconds(
          timeoutInSeconds > 28 ? 28 : timeoutInSeconds
        ),
        memorySize,
        environment
      }),
      {
        cacheKeyParameters: Object.keys(acceptedParameters)
          .filter(parameterName => acceptedParameters[parameterName].isCacheKey)
          .map(parameterName => `method.request.querystring.${parameterName}`)
      }
    ),
    {
      authorizationType: authenticationRequired
        ? AuthorizationType.CUSTOM
        : AuthorizationType.NONE,
      authorizer: authenticationRequired ? authorizer : undefined,
      requestParameters: Object.keys(acceptedParameters).reduce(
        (requestParameters, parameterName) => {
          requestParameters[
            `method.request.querystring.${parameterName}`
          ] = Boolean(acceptedParameters[parameterName].required);

          return requestParameters;
        },
        {} as Record<string, boolean>
      )
    }
  );
}
