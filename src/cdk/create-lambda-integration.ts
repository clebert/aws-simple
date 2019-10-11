import {LambdaIntegration} from '@aws-cdk/aws-apigateway';
import {Code, Function as Lambda, Runtime} from '@aws-cdk/aws-lambda';
import {Duration} from '@aws-cdk/core';
import * as path from 'path';
import {LambdaConfig} from '..';
import {Context} from '../context';
import {defaults} from '../defaults';
import {Resources} from './create-resources';

export function createLambdaIntegration(
  context: Context,
  resources: Resources,
  lambdaConfig: LambdaConfig
): void {
  const {stackName} = context;
  const {stack, restApi} = resources;

  const {
    httpMethod,
    publicPath,
    localPath,
    handler = defaults.lambdaHandler,
    memorySize = defaults.lambdaMemorySize,
    timeoutInSeconds = defaults.lambdaTimeoutInSeconds,
    acceptedParameters = {},
    getEnvironment
  } = lambdaConfig;

  restApi.root.resourceForPath(publicPath).addMethod(
    httpMethod,
    new LambdaIntegration(
      new Lambda(
        stack,
        `${context.getResourceId('lambda')}${path.join(
          publicPath,
          httpMethod
        )}`,
        {
          runtime: Runtime.NODEJS_10_X,
          code: Code.fromAsset(path.dirname(localPath)),
          handler: `${path.basename(
            localPath,
            path.extname(localPath)
          )}.${handler}`,
          timeout: Duration.seconds(timeoutInSeconds),
          memorySize,
          environment:
            getEnvironment && getEnvironment({type: 'aws', stackName})
        }
      ),
      {
        cacheKeyParameters: Object.keys(acceptedParameters)
          .filter(parameterName => acceptedParameters[parameterName].isCacheKey)
          .map(parameterName => `method.request.querystring.${parameterName}`)
      }
    ),
    {
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
