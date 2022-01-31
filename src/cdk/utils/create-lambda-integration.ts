import * as path from 'path';
import type {Stack} from 'aws-cdk-lib';
import {
  Duration,
  aws_apigateway,
  aws_iam,
  aws_lambda,
  aws_logs,
} from 'aws-cdk-lib';
import type {LambdaConfig, StackConfig} from '../../types';
import {getFullyQualifiedDomainName} from '../../utils/get-fully-qualified-domain-name';
import {getFunctionName} from '../../utils/get-function-name';
import {getLambdaModuleName} from '../../utils/get-lambda-module-name';

export function createLambdaIntegration(
  stackConfig: StackConfig,
  stack: Stack,
  restApi: aws_apigateway.RestApi,
  lambdaConfig: LambdaConfig,
  authorizer: aws_apigateway.IAuthorizer | undefined,
): void {
  const {
    httpMethod,
    publicPath,
    localPath,
    description,
    catchAll,
    handler = `handler`,
    memorySize = 3008,
    timeoutInSeconds = 28,
    acceptedParameters = {},
    environment,
    authenticationRequired,
    secretId,
  } = lambdaConfig;

  if (timeoutInSeconds > 28) {
    console.warn(
      `Due to the default timeout of the API Gateway, the maximum Lambda timeout is limited to 28 seconds.`,
    );
  }

  if (authenticationRequired && !authorizer) {
    throw new Error(
      `The Lambda config for "${httpMethod} ${publicPath}" requires authentication but no basicAuthenticationConfig has been defined.`,
    );
  }

  const functionName = getFunctionName(
    getFullyQualifiedDomainName(stackConfig),
    publicPath,
    httpMethod,
  );

  const lambdaFunction = new aws_lambda.Function(stack, functionName, {
    functionName,
    description,
    runtime: aws_lambda.Runtime.NODEJS_14_X,
    code: aws_lambda.Code.fromAsset(path.dirname(localPath)),
    handler: `${getLambdaModuleName(localPath)}.${handler}`,
    timeout: Duration.seconds(timeoutInSeconds > 28 ? 28 : timeoutInSeconds),
    memorySize,
    environment,
    tracing: aws_lambda.Tracing.PASS_THROUGH,
    logRetention: aws_logs.RetentionDays.ONE_WEEK,
  });

  if (secretId) {
    const secretsManagerPolicyStatement = new aws_iam.PolicyStatement({
      effect: aws_iam.Effect.ALLOW,
      actions: [`secretsmanager:GetSecretValue`],
      resources: [
        `arn:aws:secretsmanager:${stack.region}:${stack.account}:secret:${secretId}`,
      ],
    });

    lambdaFunction.addToRolePolicy(secretsManagerPolicyStatement);
  }

  const methodOptions: aws_apigateway.MethodOptions = {
    authorizationType: authenticationRequired
      ? aws_apigateway.AuthorizationType.CUSTOM
      : aws_apigateway.AuthorizationType.NONE,
    authorizer: authenticationRequired ? authorizer : undefined,
    requestParameters: Object.keys(acceptedParameters).reduce(
      (requestParameters, parameterName) => {
        requestParameters[`method.request.querystring.${parameterName}`] =
          Boolean(acceptedParameters[parameterName]!.required);

        return requestParameters;
      },
      {} as Record<string, boolean>,
    ),
  };

  const lambdaIntegration = new aws_apigateway.LambdaIntegration(
    lambdaFunction,
    {
      cacheKeyParameters: Object.keys(acceptedParameters)
        .filter(
          (parameterName) => acceptedParameters[parameterName]!.isCacheKey,
        )
        .map((parameterName) => `method.request.querystring.${parameterName}`),
    },
  );

  restApi.root
    .resourceForPath(publicPath)
    .addMethod(httpMethod, lambdaIntegration, methodOptions);

  if (catchAll) {
    restApi.root
      .resourceForPath(
        publicPath + (publicPath.endsWith(`/`) ? `{proxy+}` : `/{proxy+}`),
      )
      .addMethod(httpMethod, lambdaIntegration, methodOptions);
  }
}
