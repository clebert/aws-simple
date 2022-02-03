import {join} from 'path';
import type {
  MethodDeploymentOptions,
  StageOptions,
} from 'aws-cdk-lib/aws-apigateway';
import {
  AccessLogFormat,
  LogGroupLogDestination,
  MethodLoggingLevel,
} from 'aws-cdk-lib/aws-apigateway';
import type {ILogGroup} from 'aws-cdk-lib/aws-logs';
import {Duration} from 'aws-cdk-lib/core';

export interface StageOptionsInit {
  readonly accessLogGroup: ILogGroup | undefined;
  readonly methodDeployments: readonly MethodDeployment[] | undefined;
  readonly throttling: Throttling | undefined;
  readonly loggingEnabled: boolean | undefined;
  readonly metricsEnabled: boolean | undefined;
  readonly tracingEnabled: boolean | undefined;
}

export interface MethodDeployment {
  readonly httpMethod: string;
  readonly publicPath: string;
  readonly proxyName: string | undefined;
  readonly cacheTtlInSeconds: number | undefined;
}

export interface Throttling {
  readonly burstLimit: number;
  readonly rateLimit: number;
}

export function getStageOptions(init: StageOptionsInit): StageOptions {
  const {
    accessLogGroup,
    methodDeployments,
    throttling,
    loggingEnabled,
    metricsEnabled,
    tracingEnabled,
  } = init;

  const methodOptions: Record<string, MethodDeploymentOptions> | undefined =
    methodDeployments?.reduce((options, deployment) => {
      const {
        httpMethod,
        publicPath,
        proxyName,
        cacheTtlInSeconds = 0,
      } = deployment;

      const path = proxyName
        ? join(publicPath, `{${proxyName}+}`, httpMethod)
        : publicPath === `/`
        ? `//${httpMethod}`
        : join(publicPath, httpMethod);

      return {
        ...options,
        [path]: {
          cachingEnabled: cacheTtlInSeconds > 0,
          cacheTtl: Duration.seconds(cacheTtlInSeconds),
          loggingLevel: loggingEnabled
            ? MethodLoggingLevel.INFO
            : MethodLoggingLevel.OFF,
          metricsEnabled,
          throttlingBurstLimit: throttling?.burstLimit,
          throttlingRateLimit: throttling?.rateLimit,
        },
      };
    }, {});

  return {
    cacheClusterEnabled: methodDeployments?.some(
      ({cacheTtlInSeconds = 0}) => cacheTtlInSeconds > 0,
    ),
    methodOptions,
    loggingLevel: loggingEnabled
      ? MethodLoggingLevel.INFO
      : MethodLoggingLevel.OFF,
    metricsEnabled,
    accessLogDestination:
      accessLogGroup && new LogGroupLogDestination(accessLogGroup),
    accessLogFormat: accessLogGroup && AccessLogFormat.clf(),
    tracingEnabled,
  };
}
