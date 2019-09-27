import {LambdaIntegration} from '@aws-cdk/aws-apigateway';
import {Code, Function as Lambda, Runtime} from '@aws-cdk/aws-lambda';
import {Duration} from '@aws-cdk/core';
import * as path from 'path';
import {Deployment, LambdaConfig} from '../..';
import {defaults} from '../../defaults';
import {DeploymentDescriptor} from '../deployment-descriptor';

export function createLambdaIntegration(
  deployment: Deployment,
  deploymentDescriptor: DeploymentDescriptor,
  lambdaConfig: LambdaConfig
): void {
  const {stack, restApi} = deployment;
  const {resourceIds} = deploymentDescriptor;

  const {
    httpMethod,
    publicPath,
    localPath,
    handler = defaults.lambdaHandler,
    memorySize = defaults.lambdaMemorySize,
    timeoutInSeconds = defaults.lambdaTimeoutInSeconds,
    environment,
    cacheKeyParameters,
    requiredParameters
  } = lambdaConfig;

  restApi.root.resourceForPath(publicPath).addMethod(
    httpMethod,
    new LambdaIntegration(
      new Lambda(
        stack,
        `${resourceIds.lambda}${path.join(publicPath, httpMethod)}`,
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
