import {isAbsolute, join} from 'path';
import type {IAuthorizer, RestApiBase} from 'aws-cdk-lib/aws-apigateway';
import {AwsIntegration, Cors} from 'aws-cdk-lib/aws-apigateway';
import type {IRole} from 'aws-cdk-lib/aws-iam';
import {getS3IntegrationOptions} from './get-s3-integration-options';
import {getS3MethodOptions} from './get-s3-method-options';

export interface S3ResourceInit {
  readonly restApi: RestApiBase;
  readonly bucketReadRole: IRole;
  readonly requestAuthorizer: IAuthorizer | undefined;
  readonly publicPath: string;
  readonly bucketName: string;
  readonly bucketPath: string;
  readonly proxy: Proxy | undefined;
  readonly responseHeaders: Readonly<Record<string, string>> | undefined;
  readonly corsEnabled: boolean | undefined;
}

export interface Proxy {
  readonly folder: boolean;
  readonly proxyName: string;
}

export function addS3Resource(init: S3ResourceInit): void {
  const {
    restApi,
    bucketReadRole,
    requestAuthorizer,
    publicPath,
    bucketName,
    bucketPath,
    proxy,
    responseHeaders,
    corsEnabled,
  } = init;

  if (isAbsolute(bucketPath)) {
    throw new Error(`Invalid S3 bucket path.`);
  }

  const s3Integration = new AwsIntegration({
    service: `s3`,
    path: join(bucketName, bucketPath),
    integrationHttpMethod: `GET`,
    options: getS3IntegrationOptions({
      bucketReadRole,
      responseHeaders,
      corsEnabled,
      folderProxyName: proxy?.folder ? proxy.proxyName : undefined,
    }),
  });

  const resource = proxy
    ? restApi.root
        .resourceForPath(publicPath)
        .addResource(`{${proxy.proxyName}+}`)
    : restApi.root.resourceForPath(publicPath);

  if (corsEnabled) {
    resource.addCorsPreflight({
      allowOrigins: Cors.ALL_ORIGINS,
      allowCredentials: Boolean(requestAuthorizer),
    });
  }

  resource.addMethod(
    `GET`,
    s3Integration,
    getS3MethodOptions({
      requestAuthorizer,
      responseHeaders,
      corsEnabled,
      folderProxyName: proxy?.folder ? proxy.proxyName : undefined,
    }),
  );
}
