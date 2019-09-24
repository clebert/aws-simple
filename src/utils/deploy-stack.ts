import {
  DomainNameOptions,
  MethodDeploymentOptions,
  MethodLoggingLevel,
  RestApi,
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
import {
  CustomDomainConfig,
  LambdaConfig,
  LoggingLevel,
  Resources,
  StackConfig
} from '..';
import {OutputId} from '../constants/output-id';
import {ResourceId} from '../constants/resource-id';

function createDomainNameOptions(
  stackId: string,
  stack: Stack,
  customDomainConfig: CustomDomainConfig
): DomainNameOptions | undefined {
  const {certificateArn, hostedZoneName, aliasRecordName} = customDomainConfig;

  return {
    domainName: aliasRecordName
      ? `${aliasRecordName}.${hostedZoneName}`
      : hostedZoneName,
    certificate: Certificate.fromCertificateArn(
      stack,
      ResourceId.forCertificate(stackId),
      certificateArn
    )
  };
}

function createStageOptions(
  lambdaConfigs: LambdaConfig[],
  loggingLevel: LoggingLevel | undefined
): StageOptions {
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

export function deployStack(stackConfig: StackConfig): Resources {
  const {
    stackId,
    customDomainConfig,
    binaryMediaTypes,
    minimumCompressionSize,
    loggingLevel,
    lambdaConfigs = []
  } = stackConfig;

  const stack = new Stack(new App(), ResourceId.forStack(stackId));

  const restApi = new RestApi(stack, ResourceId.forRestApi(stackId), {
    domainName:
      customDomainConfig &&
      createDomainNameOptions(stackId, stack, customDomainConfig),
    binaryMediaTypes,
    minimumCompressionSize,
    deployOptions: createStageOptions(lambdaConfigs, loggingLevel)
  });

  const restApiUrlOutput = new CfnOutput(
    stack,
    ResourceId.forRestApiUrlOutput(stackId),
    {value: restApi.url, exportName: OutputId.forRestApiUrl(stackId)}
  );

  restApiUrlOutput.node.addDependency(restApi);

  if (customDomainConfig && customDomainConfig.aliasRecordName) {
    const {hostedZoneId, hostedZoneName, aliasRecordName} = customDomainConfig;

    const aRecord = new ARecord(stack, ResourceId.forARecord(stackId), {
      zone: HostedZone.fromHostedZoneAttributes(
        stack,
        ResourceId.forZone(stackId),
        {hostedZoneId, zoneName: hostedZoneName}
      ),
      recordName: aliasRecordName,
      target: RecordTarget.fromAlias(new ApiGateway(restApi))
    });

    aRecord.node.addDependency(restApi);
  }

  const s3Bucket = new Bucket(stack, ResourceId.forS3Bucket(stackId), {
    publicReadAccess: false
  });

  const s3BucketNameOutput = new CfnOutput(
    stack,
    ResourceId.forS3BucketNameOutput(stackId),
    {value: s3Bucket.bucketName, exportName: OutputId.forS3BucketName(stackId)}
  );

  s3BucketNameOutput.node.addDependency(s3Bucket);

  const s3IntegrationRole = new Role(
    stack,
    ResourceId.forS3IntegrationRole(stackId),
    {assumedBy: new ServicePrincipal('apigateway.amazonaws.com')}
  );

  const s3IntegrationPolicy = new Policy(
    stack,
    ResourceId.forS3IntegrationPolicy(stackId),
    {
      statements: [new PolicyStatement({actions: ['s3:*'], resources: ['*']})],
      roles: [s3IntegrationRole]
    }
  );

  s3IntegrationPolicy.node.addDependency(s3IntegrationRole);

  return {stack, restApi, s3Bucket, s3IntegrationRole};
}
