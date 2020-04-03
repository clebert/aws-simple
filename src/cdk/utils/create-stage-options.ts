import {
  MethodDeploymentOptions,
  MethodLoggingLevel,
  StageOptions,
} from '@aws-cdk/aws-apigateway';
import {Duration} from '@aws-cdk/core';
import * as path from 'path';
import {LambdaLoggingLevel, StackConfig} from '../../types';
import {resolveS3FileConfigs} from '../../utils/resolve-s3-file-configs';

export interface MethodConfig {
  readonly publicPath: string;
  readonly cachingEnabled?: boolean;
  readonly cacheTtlInSeconds?: number;
  readonly httpMethod?: string;
  readonly loggingLevel?: LambdaLoggingLevel;
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
  const {publicPath, httpMethod = 'GET'} = methodConfig;

  return publicPath === '/'
    ? `//${httpMethod}`
    : path.join(publicPath, httpMethod);
}

export function createStageOptions(stackConfig: StackConfig): StageOptions {
  const {lambdaConfigs = [], s3Configs = []} = stackConfig;
  const methodOptions: Record<string, MethodDeploymentOptions> = {};

  let cacheClusterEnabled = false;

  for (const lambdaConfig of lambdaConfigs) {
    if (lambdaConfig.cachingEnabled) {
      cacheClusterEnabled = true;
    }

    methodOptions[createMethodPath(lambdaConfig)] = createMethodOption(
      lambdaConfig
    );
  }

  for (const s3FileConfig of resolveS3FileConfigs(s3Configs)) {
    if (s3FileConfig.cachingEnabled) {
      cacheClusterEnabled = true;
    }

    methodOptions[createMethodPath(s3FileConfig)] = createMethodOption(
      s3FileConfig
    );
  }

  return {cacheClusterEnabled, cachingEnabled: false, methodOptions};
}
