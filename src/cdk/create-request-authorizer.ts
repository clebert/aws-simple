import type {Stack} from 'aws-cdk-lib';
import {Duration} from 'aws-cdk-lib';
import type {IAuthorizer} from 'aws-cdk-lib/aws-apigateway';
import {IdentitySource, RequestAuthorizer} from 'aws-cdk-lib/aws-apigateway';
import {createLambdaFunction} from './create-lambda-function';

export interface RequestAuthorizerInit {
  readonly stack: Stack;
  readonly functionName: string;
  readonly username: string;
  readonly password: string;
  readonly cacheTtlInSeconds: number | undefined;
}

export function createRequestAuthorizer(
  init: RequestAuthorizerInit,
): IAuthorizer {
  const {stack, functionName, username, password, cacheTtlInSeconds} = init;

  return new RequestAuthorizer(stack, `RequestAuthorizer`, {
    handler: createLambdaFunction({
      stack,
      functionName,
      filename: require.resolve(`./request-authorizer`),
      memorySize: undefined,
      timeoutInSeconds: undefined,
      environment: {USERNAME: username, PASSWORD: password},
    }),
    identitySources: [IdentitySource.header(`Authorization`)],
    resultsCacheTtl: cacheTtlInSeconds
      ? Duration.seconds(cacheTtlInSeconds)
      : undefined,
  });
}
