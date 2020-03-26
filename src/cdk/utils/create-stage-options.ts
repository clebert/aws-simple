import {
  MethodDeploymentOptions,
  MethodLoggingLevel,
  StageOptions,
} from '@aws-cdk/aws-apigateway';
import {Duration} from '@aws-cdk/core';
import * as path from 'path';
import {LambdaLoggingLevel, StackConfig} from '../../types';

export interface MethodConfig {
  readonly publicPath: string;
  readonly cachingEnabled?: boolean;
  readonly cacheTtlInSeconds?: number;
  readonly httpMethod?: string;
  readonly loggingLevel?: LambdaLoggingLevel;
  readonly type?: 'file' | 'folder';
}

function createMethodOption(
  methodConfig: MethodConfig
): MethodDeploymentOptions {
  const {cachingEnabled, cacheTtlInSeconds, loggingLevel} = methodConfig;

  return {
    cachingEnabled: Boolean(cachingEnabled),
    cacheTtl:
      cacheTtlInSeconds !== undefined
        ? Duration.seconds(cacheTtlInSeconds)
        : undefined,
    loggingLevel: loggingLevel && MethodLoggingLevel[loggingLevel],
  };
}

function createMethodPath(methodConfig: MethodConfig): string {
  const {publicPath, httpMethod = 'GET', type} = methodConfig;

  if (type === 'folder') {
    return path.join(publicPath, '{file}', httpMethod);
  }

  return publicPath === '/'
    ? `//${httpMethod}`
    : path.join(publicPath, httpMethod);
}

export function createStageOptions(stackConfig: StackConfig): StageOptions {
  const {lambdaConfigs = [], s3Configs = []} = stackConfig;
  const methodOptions: Record<string, MethodDeploymentOptions> = {};

  let cacheClusterEnabled = false;

  for (const config of lambdaConfigs) {
    if (config.cachingEnabled) {
      cacheClusterEnabled = true;
    }

    methodOptions[createMethodPath(config)] = createMethodOption(config);
  }

  for (const config of s3Configs) {
    if (config.cachingEnabled) {
      cacheClusterEnabled = true;
    }

    methodOptions[createMethodPath(config)] = createMethodOption(config);
  }

  return {cacheClusterEnabled, cachingEnabled: false, methodOptions};
}
