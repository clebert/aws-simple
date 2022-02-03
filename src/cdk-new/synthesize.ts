import type {RestApiBase} from 'aws-cdk-lib/aws-apigateway';
import type {FunctionBase} from 'aws-cdk-lib/aws-lambda';
import type {Stack} from 'aws-cdk-lib/core';
import {addLambdaResource} from './add-lambda-resource';
import {addS3Resource} from './add-s3-resource';
import {createAccessLogGroup} from './create-access-log-group';
import {createBucket} from './create-bucket';
import {createBucketReadRole} from './create-bucket-read-role';
import {createCertificate} from './create-certificate';
import {createHostedZone} from './create-hosted-zone';
import {createLambdaFunction} from './create-lambda-function';
import {createRecord} from './create-record';
import {createRequestAuthorizer} from './create-request-authorizer';
import {createRestApi} from './create-rest-api';
import {createStack} from './create-stack';
import {createUnauthorizedGatewayResponse} from './create-unauthorized-gateway-response';
import {getHash} from './get-hash';
import {getNormalizedName} from './get-normalized-name';
import {getStageOptions} from './get-stage-options';

export interface StackConfig {
  readonly hostedZoneName: string;
  readonly subdomainName?: string;
  readonly authentication?: Authentication;
  readonly throttling?: Throttling;
  readonly monitoring?: Monitoring;
  readonly routes: readonly [Route, ...Route[]];
  readonly onSynthesize?: (constructs: StackConstructs) => void;
}

export interface Authentication {
  readonly username: string;
  readonly password: string;
  readonly realm?: string;
  readonly cacheTtlInSeconds?: number;
}

export interface Throttling {
  readonly burstLimit: number;
  readonly rateLimit: number;
}

export interface Monitoring {
  readonly accessLoggingEnabled?: boolean;
  readonly loggingEnabled?: boolean;
  readonly metricsEnabled?: boolean;
  readonly tracingEnabled?: boolean;
}

export interface StackConstructs {
  readonly stack: Stack;
  readonly restApi: RestApiBase;
}

export type Route = S3Route | LambdaFunctionRoute;
export type S3Route = S3FileRoute | S3FolderRoute;

export interface RouteBase {
  readonly publicPath: string;
  readonly cacheTtlInSeconds?: number;
  readonly authenticationEnabled?: boolean;
  readonly corsEnabled?: boolean;
}

export interface S3FileRoute extends RouteBase {
  readonly type: 'file' | 'file+';
  readonly filename: string;
  readonly responseHeaders?: Readonly<Record<string, string>>;
}

export interface S3FolderRoute extends RouteBase {
  readonly type: 'folder+';
  readonly dirname: string;
  readonly responseHeaders?: Readonly<Record<string, string>>;
}

export interface LambdaFunctionRoute extends RouteBase {
  readonly type: 'function' | 'function+';
  readonly httpMethod: HttpMethod;
  readonly identifier: string;
  readonly filename: string;
  readonly memorySize?: number;
  readonly timeoutInSeconds?: number;
  readonly environment?: Readonly<Record<string, string>>;
  readonly requestParameters?: Readonly<
    Record<string, RequestParameterOptions>
  >;
  readonly devServerOptions?: DevServerOptions;
  readonly onSynthesize?: (constructs: LambdaFunctionConstructs) => void;
}

export type HttpMethod =
  | 'DELETE'
  | 'GET'
  | 'HEAD'
  | 'OPTIONS'
  | 'PATCH'
  | 'POST'
  | 'PUT';

export interface RequestParameterOptions {
  readonly cacheKey?: boolean;
  readonly required?: boolean;
}

export interface DevServerOptions {
  /**
   * Shared file dependencies from all Lambda functions that should be included
   * in the files watched for cache invalidation.
   */
  readonly sharedFileDependencies?: string[];
}

export interface LambdaFunctionConstructs extends StackConstructs {
  readonly lambdaFunction: FunctionBase;
}

const fileFunctionProxyName = `proxy`;
const folderProxyName = `folder`;

export function synthesize(stackConfig: StackConfig): void {
  const {
    hostedZoneName,
    subdomainName,
    authentication,
    throttling,
    monitoring: {
      accessLoggingEnabled,
      loggingEnabled,
      metricsEnabled,
      tracingEnabled,
    } = {},
    routes,
    onSynthesize,
  } = stackConfig;

  const domainName = subdomainName
    ? `${subdomainName}.${hostedZoneName}`
    : hostedZoneName;

  // Example: aws_simple-foo_example_com
  const stackName = `aws_simple-${getNormalizedName(domainName)}`;

  // Example: foo_example_com
  const restApiName = getNormalizedName(domainName);

  // Example: aws_simple-request_authorizer-1234567
  const requestAuthorizerFunctionName = `aws_simple-request_authorizer-${getHash(
    domainName,
  )}`;

  // Example: POST-foo_bar_baz-1234567
  const getFunctionName = (httpMethod: string, identifier: string) => {
    const functionName = `${httpMethod}-${getNormalizedName(
      identifier,
    )}-${getHash(domainName)}`;

    if (functionName.length > 64) {
      throw new Error(`Invalid Lambda function name.`);
    }

    return functionName;
  };

  const stack = createStack({stackName});
  const hostedZone = createHostedZone({stack, hostedZoneName});
  const certificate = createCertificate({stack, hostedZone, domainName});

  const stageOptions = getStageOptions({
    accessLogGroup: accessLoggingEnabled
      ? createAccessLogGroup({stack, domainName})
      : undefined,
    methodDeployments: routes.map((route) => ({
      httpMethod:
        route.type === `function` || route.type === `function+`
          ? route.httpMethod
          : `GET`,
      publicPath: route.publicPath,
      proxyName:
        route.type === `function+` || route.type === `file+`
          ? fileFunctionProxyName
          : route.type === `folder+`
          ? folderProxyName
          : undefined,
      cacheTtlInSeconds: route.cacheTtlInSeconds,
    })),
    throttling,
    loggingEnabled,
    metricsEnabled,
    tracingEnabled,
  });

  const restApi = createRestApi({
    stack,
    certificate,
    restApiName,
    domainName,
    stageOptions,
  });

  if (subdomainName) {
    createRecord({stack, hostedZone, restApi, type: `A`, subdomainName});
    createRecord({stack, hostedZone, restApi, type: `AAAA`, subdomainName});
  }

  const bucket = createBucket({stack});
  const bucketReadRole = createBucketReadRole({stack, bucket});

  const requestAuthorizer =
    authentication &&
    createRequestAuthorizer({
      stack,
      functionName: requestAuthorizerFunctionName,
      username: authentication.username,
      password: authentication.password,
      cacheTtlInSeconds: authentication.cacheTtlInSeconds,
    });

  if (authentication) {
    createUnauthorizedGatewayResponse({
      stack,
      restApi,
      realm: authentication.realm,
      corsEnabled: routes.some(({corsEnabled}) => corsEnabled),
    });
  }

  onSynthesize?.({stack, restApi});

  for (const route of routes) {
    if (route.type === `function` || route.type === `function+`) {
      const {
        type,
        httpMethod,
        publicPath,
        identifier,
        filename,
        memorySize,
        timeoutInSeconds,
        environment,
        requestParameters,
        authenticationEnabled,
        corsEnabled,
      } = route;

      const lambdaFunction = createLambdaFunction({
        stack,
        functionName: getFunctionName(httpMethod, identifier),
        filename,
        memorySize,
        timeoutInSeconds,
        environment,
      });

      addLambdaResource({
        restApi,
        lambdaFunction,
        requestAuthorizer: authenticationEnabled
          ? requestAuthorizer
          : undefined,
        httpMethod,
        publicPath,
        proxyName: type === `function+` ? fileFunctionProxyName : undefined,
        cacheKeyRequestParameterNames:
          requestParameters &&
          Object.entries(requestParameters)
            .filter(([, {cacheKey}]) => cacheKey)
            .map(([parameterName]) => parameterName),
        requiredRequestParameterNames:
          requestParameters &&
          Object.entries(requestParameters)
            .filter(([, {required}]) => required)
            .map(([parameterName]) => parameterName),
        corsEnabled,
      });

      route.onSynthesize?.({stack, restApi, lambdaFunction});
    } else if (
      route.type === `file` ||
      route.type === `file+` ||
      route.type === `folder+`
    ) {
      const {type, publicPath, responseHeaders, corsEnabled} = route;

      addS3Resource({
        restApi,
        bucketReadRole,
        requestAuthorizer,
        publicPath,
        bucketName: bucket.bucketName,
        bucketPath: type === `folder+` ? route.dirname : route.filename,
        proxy:
          type === `folder+`
            ? {folder: true, proxyName: folderProxyName}
            : type === `file+`
            ? {folder: false, proxyName: fileFunctionProxyName}
            : undefined,
        responseHeaders,
        corsEnabled,
      });
    }
  }
}
