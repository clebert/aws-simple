import type {
  App,
  AppConfig,
  LambdaConfig,
  LambdaParameterOptions,
  S3Config,
} from '../types';

export function translateAppConfig(app: App): AppConfig {
  return {
    appName: app.appName,
    appVersion: app.appVersion ?? `latest`,
    // eslint-disable-next-line complexity
    createStackConfig: (port?: number) => {
      const routes = app.routes(port);
      const binaryMediaTypes = new Set<string>();
      const lambdaConfigs: LambdaConfig[] = [];
      const s3Configs: S3Config[] = [];

      let enableCors = false;

      for (const [path, route] of Object.entries(routes)) {
        if (route.enableAuthentication && !app.authentication) {
          throw new Error(
            `Unable to enable authentication due to missing configuration.`,
          );
        }

        if (route.enableCors) {
          enableCors = true;
        }

        if (route.kind === `function`) {
          const lambdaConfig: LambdaConfig = {
            httpMethod: route.method ?? `GET`,
            publicPath: path,
            localPath: route.filename,
            description: route.description,
            catchAll: route.catchAll,
            handler: route.handler ?? `handler`,
            memorySize: route.memorySize ?? 128,
            timeoutInSeconds: route.timeoutInSeconds ?? 28,
            loggingLevel: route.loggingLevel ?? `INFO`,
            cachingEnabled: (route.cacheTtlInSeconds ?? 0) > 0,
            cacheTtlInSeconds: route.cacheTtlInSeconds,
            acceptedParameters: Object.entries(route.parameters ?? {}).reduce(
              (parameters, [parameterName, parameter]) => {
                parameters[parameterName] = {
                  isCacheKey: parameter.cached,
                  required: parameter.required,
                };

                return parameters;
              },
              {} as Record<string, LambdaParameterOptions>,
            ),
            environment: route.environment,
            authenticationRequired: route.enableAuthentication,
            devServer: route.devServer,
            secretId: route.secretId,
          };

          lambdaConfigs.push(lambdaConfig);
        } else if (route.kind === `file`) {
          if (route.binaryMediaType) {
            binaryMediaTypes.add(route.binaryMediaType);
          }

          const s3Config: S3Config = {
            type: `file`,
            binary: Boolean(route.binaryMediaType),
            publicPath: path,
            localPath: route.filename,
            bucketPath: route.filename,
            responseHeaders: route.responseHeaders,
            cachingEnabled: (route.cacheTtlInSeconds ?? 0) > 0,
            cacheTtlInSeconds: route.cacheTtlInSeconds,
            authenticationRequired: route.enableAuthentication,
          };

          s3Configs.push(s3Config);

          if (route.catchAll) {
            s3Configs.push({
              ...s3Config,
              publicPath:
                path + (path.endsWith(`/`) ? `{proxy+}` : `/{proxy+}`),
            });
          }
        } else {
          if (route.binaryMediaTypes) {
            for (const binaryMediaType of route.binaryMediaTypes) {
              binaryMediaTypes.add(binaryMediaType);
            }
          }

          s3Configs.push({
            type: `folder`,
            binary: Boolean(route.binaryMediaTypes),
            publicPath: path,
            localPath: route.dirname,
            bucketPath: route.dirname,
            responseHeaders: route.responseHeaders,
            cachingEnabled: (route.cacheTtlInSeconds ?? 0) > 0,
            cacheTtlInSeconds: route.cacheTtlInSeconds,
            authenticationRequired: route.enableAuthentication,
          });
        }
      }

      return {
        customDomainConfig: app.customDomain,
        binaryMediaTypes: Array.from(binaryMediaTypes),
        minimumCompressionSizeInBytes: app.disableCompression
          ? undefined
          : 1000,
        lambdaConfigs,
        s3Configs,
        basicAuthenticationConfig: app.authentication,
        enableCors,
        webAclArn: app.webAclArn,
        throttling: app.throttling,
        enableTracing: app.enableTracing,
        enableMetrics: app.enableMetrics,
        enableAccessLogging: app.enableAccessLogging,
      };
    },
  };
}
