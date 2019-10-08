import {
  DomainNameOptions,
  MethodDeploymentOptions,
  MethodLoggingLevel,
  RestApi,
  RestApiProps,
  StageOptions
} from '@aws-cdk/aws-apigateway';
import {Certificate} from '@aws-cdk/aws-certificatemanager';
import {
  Policy,
  PolicyStatement,
  Role,
  ServicePrincipal
} from '@aws-cdk/aws-iam';
import {ARecord, HostedZone, RecordTarget} from '@aws-cdk/aws-route53';
import {ApiGateway} from '@aws-cdk/aws-route53-targets';
import {Bucket} from '@aws-cdk/aws-s3';
import {App, CfnOutput, Duration, Stack} from '@aws-cdk/core';
import * as path from 'path';
import {Context} from '../context';

export interface Resources {
  readonly stack: Stack;
  readonly restApi: RestApi;
  readonly s3Bucket: Bucket;
  readonly s3IntegrationRole: Role;
}

function createDomainNameOptions(
  context: Context,
  stack: Stack
): DomainNameOptions | undefined {
  const {
    appConfig: {customDomainConfig},
    resourceIds
  } = context;

  if (!customDomainConfig) {
    return;
  }

  const {certificateArn, hostedZoneName, aliasRecordName} = customDomainConfig;

  return {
    domainName: aliasRecordName
      ? `${aliasRecordName}.${hostedZoneName}`
      : hostedZoneName,
    certificate: Certificate.fromCertificateArn(
      stack,
      resourceIds.certificate,
      certificateArn
    )
  };
}

function createStageOptions(context: Context): StageOptions {
  const {
    appConfig: {loggingLevel, lambdaConfigs = []}
  } = context;

  const restApiMethodOptions: Record<string, MethodDeploymentOptions> = {};

  let rootCachingEnabled = false;
  let rootCacheTtl: Duration | undefined;

  const cacheClusterEnabled = lambdaConfigs.some(
    ({cachingEnabled}) => cachingEnabled
  );

  if (cacheClusterEnabled) {
    for (const lambdaConfig of lambdaConfigs) {
      const {
        httpMethod,
        publicPath,
        cachingEnabled,
        cacheTtlInSeconds
      } = lambdaConfig;

      if (publicPath === '/') {
        if (cachingEnabled) {
          rootCachingEnabled = cachingEnabled;
        }

        if (cacheTtlInSeconds) {
          rootCacheTtl = Duration.seconds(cacheTtlInSeconds);
        }
      } else {
        restApiMethodOptions[path.join(publicPath, httpMethod)] = {
          cachingEnabled: Boolean(cachingEnabled),
          cacheTtl:
            cacheTtlInSeconds !== undefined
              ? Duration.seconds(cacheTtlInSeconds)
              : undefined
        };
      }
    }
  }

  return {
    cacheClusterEnabled,
    cachingEnabled: rootCachingEnabled,
    cacheTtl: rootCacheTtl,
    methodOptions: restApiMethodOptions,
    loggingLevel: loggingLevel && MethodLoggingLevel[loggingLevel]
  };
}

function createRestApiProps(context: Context, stack: Stack): RestApiProps {
  const {
    appConfig: {binaryMediaTypes, minimumCompressionSize}
  } = context;

  return {
    domainName: createDomainNameOptions(context, stack),
    binaryMediaTypes,
    minimumCompressionSize,
    deployOptions: createStageOptions(context)
  };
}

function createARecord(context: Context, stack: Stack, restApi: RestApi): void {
  const {
    appConfig: {customDomainConfig},
    resourceIds
  } = context;

  if (!customDomainConfig) {
    return;
  }

  const {hostedZoneId, hostedZoneName, aliasRecordName} = customDomainConfig;

  const aRecord = new ARecord(stack, resourceIds.aRecord, {
    zone: HostedZone.fromHostedZoneAttributes(stack, resourceIds.zone, {
      hostedZoneId,
      zoneName: hostedZoneName
    }),
    recordName: aliasRecordName,
    target: RecordTarget.fromAlias(new ApiGateway(restApi))
  });

  aRecord.node.addDependency(restApi);
}

export function createResources(context: Context): Resources {
  const {outputIds, resourceIds} = context;
  const stack = new Stack(new App(), resourceIds.stack);

  const restApi = new RestApi(
    stack,
    resourceIds.restApi,
    createRestApiProps(context, stack)
  );

  const restApiUrlOutput = new CfnOutput(stack, resourceIds.restApiUrlOutput, {
    value: restApi.url,
    exportName: outputIds.restApiUrl
  });

  restApiUrlOutput.node.addDependency(restApi);

  createARecord(context, stack, restApi);

  const s3Bucket = new Bucket(stack, resourceIds.s3Bucket, {
    publicReadAccess: false
  });

  const s3BucketNameOutput = new CfnOutput(
    stack,
    resourceIds.s3BucketNameOutput,
    {value: s3Bucket.bucketName, exportName: outputIds.s3BucketName}
  );

  s3BucketNameOutput.node.addDependency(s3Bucket);

  const s3IntegrationRole = new Role(stack, resourceIds.s3IntegrationRole, {
    assumedBy: new ServicePrincipal('apigateway.amazonaws.com')
  });

  const s3IntegrationPolicy = new Policy(
    stack,
    resourceIds.s3IntegrationPolicy,
    {
      statements: [new PolicyStatement({actions: ['s3:*'], resources: ['*']})],
      roles: [s3IntegrationRole]
    }
  );

  s3IntegrationPolicy.node.addDependency(s3IntegrationRole);

  return {stack, restApi, s3Bucket, s3IntegrationRole};
}
