import {
  MethodDeploymentOptions,
  MethodLoggingLevel,
  StageOptions
} from '@aws-cdk/aws-apigateway';
import {Duration} from '@aws-cdk/core';
import * as path from 'path';
import {StackConfig} from '../../types';

export function createStageOptions(stackConfig: StackConfig): StageOptions {
  const {loggingLevel, lambdaConfigs = []} = stackConfig;
  const restApiMethodOptions: Record<string, MethodDeploymentOptions> = {};

  let rootCachingEnabled = false;
  let rootCacheTtl: Duration | undefined;

  const cacheClusterEnabled = lambdaConfigs.some(
    ({cachingEnabled}) => cachingEnabled
  );

  if (cacheClusterEnabled) {
    for (const lambdaConfig of lambdaConfigs) {
      const {
        httpMethod,
        publicPath,
        cachingEnabled,
        cacheTtlInSeconds
      } = lambdaConfig;

      if (publicPath === '/') {
        if (cachingEnabled) {
          rootCachingEnabled = cachingEnabled;
        }

        if (cacheTtlInSeconds) {
          rootCacheTtl = Duration.seconds(cacheTtlInSeconds);
        }
      } else {
        restApiMethodOptions[path.join(publicPath, httpMethod)] = {
          cachingEnabled: Boolean(cachingEnabled),
          cacheTtl:
            cacheTtlInSeconds !== undefined
              ? Duration.seconds(cacheTtlInSeconds)
              : undefined
        };
      }
    }
  }

  return {
    cacheClusterEnabled,
    cachingEnabled: rootCachingEnabled,
    cacheTtl: rootCacheTtl,
    methodOptions: restApiMethodOptions,
    loggingLevel: loggingLevel && MethodLoggingLevel[loggingLevel]
  };
}
