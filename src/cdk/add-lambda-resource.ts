import {join} from 'path';
import type {IAuthorizer, RestApiBase} from 'aws-cdk-lib/aws-apigateway';
import {Cors, LambdaIntegration} from 'aws-cdk-lib/aws-apigateway';
import type {FunctionBase} from 'aws-cdk-lib/aws-lambda';
import {getLambdaIntegrationOptions} from './get-lambda-integration-options';
import {getLambdaMethodOptions} from './get-lambda-method-options';

export interface LambdaResourceInit {
  readonly restApi: RestApiBase;
  readonly lambdaFunction: FunctionBase;
  readonly requestAuthorizer: IAuthorizer | undefined;
  readonly httpMethod: string;
  readonly publicPath: string;
  readonly proxyName: string | undefined;
  readonly cacheKeyRequestParameterNames: readonly string[] | undefined;
  readonly requiredRequestParameterNames: readonly string[] | undefined;
  readonly corsEnabled: boolean | undefined;
}

export function addLambdaResource(init: LambdaResourceInit): void {
  const {
    restApi,
    lambdaFunction,
    requestAuthorizer,
    httpMethod,
    publicPath,
    proxyName,
    cacheKeyRequestParameterNames,
    requiredRequestParameterNames,
    corsEnabled,
  } = init;

  const lambdaIntegration = new LambdaIntegration(
    lambdaFunction,
    getLambdaIntegrationOptions({cacheKeyRequestParameterNames}),
  );

  const resource = proxyName
    ? restApi.root.resourceForPath(join(publicPath, `{${proxyName}+}`))
    : restApi.root.resourceForPath(publicPath);

  if (corsEnabled) {
    resource.addCorsPreflight({
      allowOrigins: Cors.ALL_ORIGINS,
      allowCredentials: Boolean(requestAuthorizer),
    });
  }

  resource.addMethod(
    httpMethod,
    lambdaIntegration,
    getLambdaMethodOptions({requestAuthorizer, requiredRequestParameterNames}),
  );
}
