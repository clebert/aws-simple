import type {IAuthorizer, MethodOptions} from 'aws-cdk-lib/aws-apigateway';
import {AuthorizationType} from 'aws-cdk-lib/aws-apigateway';

export interface LambdaMethodOptionsInit {
  readonly requestAuthorizer: IAuthorizer | undefined;
  readonly requiredRequestParameterNames: readonly string[] | undefined;
}

export function getLambdaMethodOptions(
  init: LambdaMethodOptionsInit,
): MethodOptions {
  const {requestAuthorizer, requiredRequestParameterNames} = init;

  const requiredRequestParameters = requiredRequestParameterNames?.reduce<
    Record<string, boolean>
  >((parameters, parameterName) => {
    parameters[`method.request.querystring.${parameterName}`] = true;

    return parameters;
  }, {});

  return {
    authorizationType: requestAuthorizer
      ? AuthorizationType.CUSTOM
      : AuthorizationType.NONE,
    authorizer: requestAuthorizer,
    requestParameters: requiredRequestParameters,
  };
}
