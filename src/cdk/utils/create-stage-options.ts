import {
  MethodDeploymentOptions,
  MethodLoggingLevel,
  StageOptions
} from '@aws-cdk/aws-apigateway';
import {Duration} from '@aws-cdk/core';
import * as path from 'path';
import {StackConfig} from '../../types';

export interface MethodConfig {
  readonly publicPath: string;
  readonly cachingEnabled?: boolean;
  readonly cacheTtlInSeconds?: number;
  readonly httpMethod?: string;
  readonly type?: 'file' | 'folder';
}

function createMethodOption(
  methodConfig: MethodConfig
): MethodDeploymentOptions {
  const {cachingEnabled, cacheTtlInSeconds} = methodConfig;

  return {
    cachingEnabled: Boolean(cachingEnabled),
    cacheTtl:
      cacheTtlInSeconds !== undefined
        ? Duration.seconds(cacheTtlInSeconds)
        : undefined
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
  const {loggingLevel, lambdaConfigs = [], s3Configs = []} = stackConfig;
  const methodOptions: Record<string, MethodDeploymentOptions> = {};

  for (const lambdaConfig of lambdaConfigs) {
    methodOptions[createMethodPath(lambdaConfig)] = createMethodOption(
      lambdaConfig
    );
  }

  for (const s3Config of s3Configs) {
    methodOptions[createMethodPath(s3Config)] = createMethodOption(s3Config);
  }

  return {
    cacheClusterEnabled: true,
    cachingEnabled: false,
    methodOptions,
    loggingLevel: loggingLevel && MethodLoggingLevel[loggingLevel]
  };
}
