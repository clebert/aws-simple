import path from 'path';
import type {Stack} from 'aws-cdk-lib';
import {Duration, aws_apigateway, aws_lambda} from 'aws-cdk-lib';
import type {StackConfig} from '../../types';

export function createBasicAuthorizer(
  appName: string,
  appVersion: string,
  stackConfig: StackConfig,
  stack: Stack
): aws_apigateway.RequestAuthorizer | undefined {
  if (!stackConfig.basicAuthenticationConfig) {
    return undefined;
  }

  const {username, password, cacheTtlInSeconds} =
    stackConfig.basicAuthenticationConfig;

  return new aws_apigateway.RequestAuthorizer(stack, `BasicAuthorizer`, {
    handler: new aws_lambda.Function(stack, `AuthorizerLambda`, {
      description: `${appName} Authorizer Lambda ${appVersion}`,
      runtime: aws_lambda.Runtime.NODEJS_14_X,
      code: aws_lambda.Code.fromAsset(
        path.dirname(require.resolve(`./basic-authorizer-handler`))
      ),
      handler: `index.handler`,
      environment: {USERNAME: username, PASSWORD: password},
    }),
    identitySources: [aws_apigateway.IdentitySource.header(`Authorization`)],
    resultsCacheTtl: cacheTtlInSeconds
      ? Duration.seconds(cacheTtlInSeconds)
      : undefined,
  });
}
