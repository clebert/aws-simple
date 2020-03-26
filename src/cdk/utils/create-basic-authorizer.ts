import {RequestAuthorizer, IdentitySource} from '@aws-cdk/aws-apigateway';
import {Code, Function as Lambda, Runtime} from '@aws-cdk/aws-lambda';
import {Stack, Duration} from '@aws-cdk/core';
import path from 'path';
import {StackConfig} from '../../types';

export function createBasicAuthorizer(
  appName: string,
  appVersion: string,
  stackConfig: StackConfig,
  stack: Stack
): RequestAuthorizer | undefined {
  if (!stackConfig.basicAuthenticationConfig) {
    return undefined;
  }

  const {
    username,
    password,
    cacheTtlInSeconds
  } = stackConfig.basicAuthenticationConfig;

  return new RequestAuthorizer(stack, 'BasicAuthorizer', {
    handler: new Lambda(stack, 'AuthorizerLambda', {
      description: `${appName} Authorizer Lambda ${appVersion}`,
      runtime: Runtime.NODEJS_10_X,
      code: Code.fromAsset(
        path.dirname(require.resolve('./basic-authorizer-handler'))
      ),
      handler: 'index.handler',
      environment: {USERNAME: username, PASSWORD: password}
    }),
    identitySources: [IdentitySource.header('Authorization')],
    resultsCacheTtl: cacheTtlInSeconds
      ? Duration.seconds(cacheTtlInSeconds)
      : undefined
  });
}
