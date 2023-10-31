import type { S3Route } from '../parse-stack-config.js';
import type { aws_iam, aws_s3 } from 'aws-cdk-lib';

import { addCorsPreflight } from './add-cors-preflight.js';
import { aws_apigateway } from 'aws-cdk-lib';
import { join } from 'path';

export interface S3ResourceConstructDependencies {
  readonly bucket: aws_s3.IBucket;
  readonly bucketReadRole: aws_iam.IRole;
  readonly requestAuthorizer: aws_apigateway.IAuthorizer | undefined;
  readonly restApi: aws_apigateway.RestApiBase;
}

export function addS3Resource(
  route: S3Route,
  constructDependencies: S3ResourceConstructDependencies,
): void {
  const { bucket, bucketReadRole, requestAuthorizer, restApi } = constructDependencies;
  const { type, publicPath, path, authenticationEnabled, corsEnabled } = route;

  if (authenticationEnabled && !requestAuthorizer) {
    throw new Error(
      `Authentication cannot be enabled because no authentication options are configured.`,
    );
  }

  const integration = new aws_apigateway.AwsIntegration({
    service: `s3`,
    path:
      type === `folder` ? join(bucket.bucketName, path, `{proxy}`) : join(bucket.bucketName, path),
    integrationHttpMethod: `GET`,
    options: getS3IntegrationOptions(route, bucketReadRole),
  });

  const methodOptions = getS3MethodOptions(route, requestAuthorizer);

  if (type === `file`) {
    const resource = restApi.root.resourceForPath(publicPath.replace(`/*`, `/`));

    if (corsEnabled) {
      addCorsPreflight(resource, { authenticationEnabled });
    }

    resource.addMethod(`GET`, integration, methodOptions);
  }

  if (publicPath.endsWith(`/*`)) {
    const proxyResource = restApi.root.resourceForPath(publicPath.replace(`/*`, `/{proxy+}`));

    if (corsEnabled) {
      addCorsPreflight(proxyResource, { authenticationEnabled });
    }

    proxyResource.addMethod(`GET`, integration, methodOptions);
  }
}

function getS3IntegrationOptions(
  route: S3Route,
  bucketReadRole: aws_iam.IRole,
): aws_apigateway.IntegrationOptions {
  const { type, responseHeaders, corsEnabled } = route;

  const corsResponseParameters: Record<string, string> = corsEnabled
    ? { 'method.response.header.Access-Control-Allow-Origin': `'*'` }
    : {};

  const responseParameters = {
    'method.response.header.Content-Type': `integration.response.header.Content-Type`,
    ...corsResponseParameters,
    ...Object.entries(responseHeaders ?? {}).reduce(
      (parameters, [key, value]) => ({
        ...parameters,
        [`method.response.header.${key}`]: `'${value}'`,
      }),
      {} as Record<string, string>,
    ),
  };

  return {
    credentialsRole: bucketReadRole,
    integrationResponses: [
      {
        selectionPattern: `200`,
        statusCode: `200`,
        responseParameters,
      },
      {
        selectionPattern: `404`,
        statusCode: `404`,
        responseParameters: corsResponseParameters,
      },
      {
        selectionPattern: `5\\d{2}`,
        statusCode: `500`,
        responseParameters: corsResponseParameters,
      },
    ],
    requestParameters:
      type === `folder` ? { 'integration.request.path.proxy': `method.request.path.proxy` } : {},
    cacheKeyParameters: type === `folder` ? [`method.request.path.proxy`] : [],
  };
}

function getS3MethodOptions(
  route: S3Route,
  requestAuthorizer: aws_apigateway.IAuthorizer | undefined,
): aws_apigateway.MethodOptions {
  const { type, responseHeaders, authenticationEnabled, corsEnabled } = route;

  const corsResponseParameters: Record<string, boolean> = corsEnabled
    ? { 'method.response.header.Access-Control-Allow-Origin': true }
    : {};

  const responseHeaderNames = Object.keys(responseHeaders ?? []);

  const responseParameters = {
    'method.response.header.Content-Type': true,
    ...corsResponseParameters,
    ...responseHeaderNames.reduce(
      (parameters, headerName) => ({
        ...parameters,
        [`method.response.header.${headerName}`]: true,
      }),
      {} as Record<string, boolean>,
    ),
  };

  return {
    authorizationType: authenticationEnabled
      ? aws_apigateway.AuthorizationType.CUSTOM
      : aws_apigateway.AuthorizationType.NONE,
    authorizer: authenticationEnabled ? requestAuthorizer : undefined,
    methodResponses: [
      { statusCode: `200`, responseParameters },
      { statusCode: `404`, responseParameters: corsResponseParameters },
      { statusCode: `500`, responseParameters: corsResponseParameters },
    ],
    requestParameters: type === `folder` ? { 'method.request.path.proxy': true } : {},
  };
}
