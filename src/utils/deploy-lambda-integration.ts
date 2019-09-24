import {LambdaIntegration} from '@aws-cdk/aws-apigateway';
import {Code, Function as Lambda, Runtime} from '@aws-cdk/aws-lambda';
import {Duration} from '@aws-cdk/core';
import * as path from 'path';
import {LambdaConfig, Resources} from '..';
import {Defaults} from '../constants/defaults';
import {ResourceId} from '../constants/resource-id';

export function deployLambdaIntegration(
  stackId: string,
  resources: Resources,
  lambdaConfig: LambdaConfig
): void {
  const {stack, restApi} = resources;

  const {
    httpMethod,
    publicPath,
    localPath,
    handler = Defaults.lambdaHandler,
    memorySize = Defaults.lambdaMemorySize,
    timeoutInSeconds = Defaults.lambdaTimeoutInSeconds,
    environment,
    cacheKeyParameters,
    requiredParameters
  } = lambdaConfig;

  restApi.root.resourceForPath(publicPath).addMethod(
    httpMethod,
    new LambdaIntegration(
      new Lambda(
        stack,
        ResourceId.forLambda(stackId, path.join(publicPath, httpMethod)),
        {
          runtime: Runtime.NODEJS_10_X,
          code: Code.fromAsset(path.dirname(localPath)),
          handler: `${path.basename(
            localPath,
            path.extname(localPath)
          )}.${handler}`,
          timeout: Duration.seconds(timeoutInSeconds),
          memorySize,
          environment
        }
      ),
      {cacheKeyParameters}
    ),
    {
      requestParameters:
        cacheKeyParameters &&
        cacheKeyParameters.reduce<Record<string, boolean>>(
          (parameters, parameter) => {
            parameters[
              `method.request.querystring.${parameter}`
            ] = requiredParameters
              ? requiredParameters.includes(parameter)
              : false;

            return parameters;
          },
          {}
        )
    }
  );
}
