import {join} from 'path';
import type {Stack} from 'aws-cdk-lib';
import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  aws_apigateway,
  aws_certificatemanager,
  aws_logs,
  aws_route53,
  aws_route53_targets,
} from 'aws-cdk-lib';
import type {StackConfig} from '../read-stack-config';
import {getDomainName} from '../utils/get-domain-name';
import {getHash} from '../utils/get-hash';
import {getNormalizedName} from '../utils/get-normalized-name';

export function createRestApi(
  stackConfig: StackConfig,
  stack: Stack,
): aws_apigateway.RestApiBase {
  const {hostedZoneName, aliasRecordName} = stackConfig;

  if (!hostedZoneName) {
    throw new Error(`The hosted zone cannot be looked up without a name.`);
  }

  const hostedZone = aws_route53.HostedZone.fromLookup(
    stack,
    `HostedZoneLookup`,
    {domainName: hostedZoneName},
  );

  new CfnOutput(stack, `HostedZoneNameOutput`, {value: hostedZoneName});

  const domainName = getDomainName({hostedZoneName, aliasRecordName});

  const certificate = new aws_certificatemanager.DnsValidatedCertificate(
    stack,
    `DnsValidatedCertificate`,
    {domainName, hostedZone},
  );

  const restApi = new aws_apigateway.RestApi(stack, `RestApi`, {
    description: `https://${domainName}`,
    endpointTypes: [aws_apigateway.EndpointType.REGIONAL],
    restApiName: `${getNormalizedName(domainName)}-${getHash(domainName)}`,
    domainName: {
      endpointType: aws_apigateway.EndpointType.REGIONAL,
      domainName,
      certificate,
      securityPolicy: aws_apigateway.SecurityPolicy.TLS_1_2,
    },
    disableExecuteApiEndpoint: true,
    binaryMediaTypes: [`*/*`],
    minimumCompressionSize: 150,
    deployOptions: getStageOptions(stackConfig, stack, domainName),
  });

  const recordTarget = aws_route53.RecordTarget.fromAlias(
    new aws_route53_targets.ApiGateway(restApi),
  );

  new aws_route53.ARecord(stack, `ARecord`, {
    zone: hostedZone,
    recordName: aliasRecordName,
    target: recordTarget,
  }).node.addDependency(restApi);

  new aws_route53.AaaaRecord(stack, `AaaaRecord`, {
    zone: hostedZone,
    recordName: aliasRecordName,
    target: recordTarget,
  }).node.addDependency(restApi);

  setUnauthorizedGatewayResponse(stackConfig, stack, restApi);

  new CfnOutput(stack, `RestApiIdOutput`, {
    value: restApi.restApiId,
  }).node.addDependency(restApi);

  return restApi;
}

function getStageOptions(
  stackConfig: StackConfig,
  stack: Stack,
  domainName: string,
): aws_apigateway.StageOptions {
  const {cachingEnabled, monitoring, routes} = stackConfig;

  const loggingLevel: aws_apigateway.MethodLoggingLevel =
    monitoring === true || monitoring?.loggingEnabled
      ? aws_apigateway.MethodLoggingLevel.INFO
      : aws_apigateway.MethodLoggingLevel.OFF;

  const methodOptionsByPath: Record<
    string,
    aws_apigateway.MethodDeploymentOptions
  > = {};

  for (const route of routes) {
    const {
      type,
      httpMethod = `GET`,
      publicPath,
      throttling,
      cacheTtlInSeconds = 300,
    } = route;

    const methodOptions: aws_apigateway.MethodDeploymentOptions = {
      cachingEnabled: cachingEnabled && cacheTtlInSeconds > 0,
      cacheTtl: Duration.seconds(cacheTtlInSeconds),
      loggingLevel,
      metricsEnabled: monitoring === true || monitoring?.metricsEnabled,
      throttlingBurstLimit: throttling?.burstLimit,
      throttlingRateLimit: throttling?.rateLimit,
    };

    if (type !== `folder`) {
      const nonProxyPublicPath = publicPath.replace(`/*`, `/`);

      methodOptionsByPath[
        nonProxyPublicPath === `/`
          ? `//${httpMethod}`
          : join(nonProxyPublicPath, httpMethod)
      ] = methodOptions;
    }

    if (publicPath.endsWith(`/*`)) {
      methodOptionsByPath[
        join(publicPath.replace(`/*`, `/{proxy+}`), httpMethod)
      ] = methodOptions;
    }
  }

  const accessLogDestination =
    monitoring === true || monitoring?.accessLoggingEnabled
      ? new aws_apigateway.LogGroupLogDestination(
          new aws_logs.LogGroup(stack, `AccessLogGroup`, {
            logGroupName: `/aws/apigateway/accessLogs/${domainName}`,
            retention: aws_logs.RetentionDays.TWO_WEEKS,
            removalPolicy: RemovalPolicy.DESTROY,
          }),
        )
      : undefined;

  return {
    cacheClusterEnabled: cachingEnabled,
    methodOptions: methodOptionsByPath,
    accessLogDestination,
    loggingLevel,
    metricsEnabled: monitoring === true || monitoring?.metricsEnabled,
    tracingEnabled: monitoring === true || monitoring?.tracingEnabled,
  };
}

function setUnauthorizedGatewayResponse(
  stackConfig: StackConfig,
  stack: Stack,
  restApi: aws_apigateway.RestApiBase,
): void {
  const {authentication} = stackConfig;

  if (!authentication) {
    return;
  }

  const corsEnabled = stackConfig.routes.some((route) => route.corsEnabled);

  const corsResponseHeaders: Record<string, string> = corsEnabled
    ? {
        'gatewayresponse.header.Access-Control-Allow-Origin': `method.request.header.origin`,
        'gatewayresponse.header.Access-Control-Allow-Credentials': `'true'`,
        'gatewayresponse.header.Access-Control-Allow-Headers': `'Authorization,*'`,
      }
    : {};

  const {realm} = authentication;

  new aws_apigateway.GatewayResponse(stack, `UnauthorizedGatewayResponse`, {
    restApi,
    type: aws_apigateway.ResponseType.UNAUTHORIZED,
    responseHeaders: {
      ...corsResponseHeaders,
      'gatewayresponse.header.WWW-Authenticate': realm
        ? `'Basic realm=${realm}'`
        : `'Basic'`,
    },
    templates: {
      'application/json': `{"message":$context.error.messageString}`,
      'text/html': `$context.error.message`,
    },
  });
}
