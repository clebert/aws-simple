import {LambdaIntegration} from '@aws-cdk/aws-apigateway';
import {Code, Function as Lambda, Runtime} from '@aws-cdk/aws-lambda';
import {Duration} from '@aws-cdk/core';
import {createHash} from 'crypto';
import * as path from 'path';
import {LambdaConfig} from '../types';
import {Resources} from './create-resources';

export function createLambdaIntegration(
  resources: Resources,
  lambdaConfig: LambdaConfig
): void {
  const {stack, restApi} = resources;

  const {
    httpMethod,
    publicPath,
    localPath,
    handler = 'handler',
    memorySize = 3008,
    timeoutInSeconds = 30,
    acceptedParameters = {},
    environment
  } = lambdaConfig;

  restApi.root.resourceForPath(publicPath).addMethod(
    httpMethod,
    new LambdaIntegration(
      new Lambda(
        stack,
        `Lambda${httpMethod}${createHash('sha1')
          .update(publicPath)
          .digest()
          .toString('hex')
          .slice(8)}`,
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
