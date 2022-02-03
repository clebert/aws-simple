import type {LambdaIntegrationOptions} from 'aws-cdk-lib/aws-apigateway';

export interface LambdaIntegrationOptionsInit {
  readonly cacheKeyRequestParameterNames: readonly string[] | undefined;
}

export function getLambdaIntegrationOptions(
  init: LambdaIntegrationOptionsInit,
): LambdaIntegrationOptions {
  return {
    cacheKeyParameters: init.cacheKeyRequestParameterNames?.map(
      (parameterName) => `method.request.querystring.${parameterName}`,
    ),
  };
}
