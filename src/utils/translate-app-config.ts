import {
  App,
  AppConfig,
  LambdaConfig,
  LambdaParameterOptions,
  S3Config,
} from '../types';

export function translateAppConfig(app: App): AppConfig {
  return {
    appName: app.appName,
    appVersion: app.appVersion ?? 'latest',
    createStackConfig: (port?: number) => {
      const routes = app.routes(port);
      const binaryMediaTypes: string[] = [];
      const lambdaConfigs: LambdaConfig[] = [];
      const s3Configs: S3Config[] = [];

      let enableCors = false;

      for (const [path, route] of Object.entries(routes)) {
        if (route.enableAuthentication && !app.authentication) {
          throw new Error(
            'Unable to enable authentication due to missing configuration.'
          );
        }

        if (route.enableCors) {
          enableCors = true;
        }

        if (route.kind === 'function') {
          const lambdaConfig: LambdaConfig = {
            httpMethod: route.method ?? 'GET',
            publicPath: path,
            localPath: route.filename,
            description: route.routeName,
            handler: route.handler,
            memorySize: route.memorySize ?? 128,
            timeoutInSeconds: route.timeoutInSeconds,
            loggingLevel: route.loggingLevel,
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
              {} as Record<string, LambdaParameterOptions>
            ),
            environment: route.environment,
            authenticationRequired: route.enableAuthentication,
          };

          lambdaConfigs.push(lambdaConfig);

          if (route.catchAll) {
            lambdaConfigs.push({
              ...lambdaConfig,
              publicPath: path.endsWith('/') ? '{proxy+}' : '/{proxy+}',
            });
          }
        } else if (route.kind === 'file') {
          if (route.binaryMediaType) {
            binaryMediaTypes.push(route.binaryMediaType);
          }

          const s3Config: S3Config = {
            type: 'file',
            binary: Boolean(route.binaryMediaType),
            publicPath: path,
            localPath: route.filename,
            bucketPath: route.filename,
            responseHeaders: {cacheControl: route.cacheControl},
            cachingEnabled: (route.cacheTtlInSeconds ?? 0) > 0,
            cacheTtlInSeconds: route.cacheTtlInSeconds,
            authenticationRequired: route.enableAuthentication,
          };

          s3Configs.push(s3Config);

          if (route.catchAll) {
            s3Configs.push({
              ...s3Config,
              publicPath: path.endsWith('/') ? '{proxy+}' : '/{proxy+}',
            });
          }
        } else {
          if (route.binaryMediaTypes) {
            binaryMediaTypes.push(...route.binaryMediaTypes);
          }

          s3Configs.push({
            type: 'folder',
            binary: Boolean(route.binaryMediaTypes),
            publicPath: path,
            localPath: route.dirname,
            bucketPath: route.dirname,
            responseHeaders: {cacheControl: route.cacheControl},
            cachingEnabled: (route.cacheTtlInSeconds ?? 0) > 0,
            cacheTtlInSeconds: route.cacheTtlInSeconds,
            authenticationRequired: route.enableAuthentication,
          });
        }
      }

      return {
        customDomainConfig: app.customDomain,
        binaryMediaTypes,
        minimumCompressionSizeInBytes: app.disableCompression
          ? undefined
          : 1000,
        lambdaConfigs,
        s3Configs,
        basicAuthenticationConfig: app.authentication,
        enableCors,
      };
    },
  };
}
