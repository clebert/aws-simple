import * as path from 'path';
import {Duration, aws_apigateway} from 'aws-cdk-lib';
import type {LambdaLoggingLevel, StackConfig} from '../../types';

export interface MethodConfig {
  readonly publicPath: string;
  readonly cachingEnabled?: boolean;
  readonly cacheTtlInSeconds?: number;
  readonly httpMethod?: string;
  readonly loggingLevel?: LambdaLoggingLevel;
  readonly type?: 'file' | 'folder';
}

function createMethodOptions(
  methodConfig: MethodConfig,
): aws_apigateway.MethodDeploymentOptions {
  const {cachingEnabled, cacheTtlInSeconds, loggingLevel} = methodConfig;

  return {
    cachingEnabled: Boolean(cachingEnabled),
    cacheTtl:
      cacheTtlInSeconds !== undefined
        ? Duration.seconds(cacheTtlInSeconds)
        : undefined,
    loggingLevel:
      loggingLevel && aws_apigateway.MethodLoggingLevel[loggingLevel],
  };
}

function createMethodPath(methodConfig: MethodConfig): string {
  const {publicPath, httpMethod = `GET`, type} = methodConfig;

  if (type === `folder`) {
    return path.join(publicPath, `{file}`, httpMethod);
  }

  return publicPath === `/`
    ? `//${httpMethod}`
    : path.join(publicPath, httpMethod);
}

export function createStageOptions(
  stackConfig: StackConfig,
): aws_apigateway.StageOptions {
  const {lambdaConfigs = [], s3Configs = [], throttling} = stackConfig;

  const methodOptions: Record<string, aws_apigateway.MethodDeploymentOptions> =
    {};

  let cacheClusterEnabled = false;

  for (const lambdaConfig of lambdaConfigs) {
    if (lambdaConfig.cachingEnabled) {
      cacheClusterEnabled = true;
    }

    methodOptions[createMethodPath(lambdaConfig)] =
      createMethodOptions(lambdaConfig);
  }

  for (const s3Config of s3Configs) {
    if (s3Config.cachingEnabled) {
      cacheClusterEnabled = true;
    }

    methodOptions[createMethodPath(s3Config)] = createMethodOptions(s3Config);
  }

  return {
    cacheClusterEnabled,
    cachingEnabled: false,
    methodOptions,
    ...(throttling
      ? {
          throttlingBurstLimit: throttling.burstLimit,
          throttlingRateLimit: throttling.rateLimit,
        }
      : {}),
  };
}
