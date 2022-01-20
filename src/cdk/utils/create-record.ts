import type {Stack, aws_apigateway} from 'aws-cdk-lib';
import {Duration, aws_route53, aws_route53_targets} from 'aws-cdk-lib';
import type {StackConfig} from '../../types';

export function createRecord(
  stackConfig: StackConfig,
  stack: Stack,
  restApi: aws_apigateway.RestApi,
  type: 'a' | 'aaaa',
): void {
  const {customDomainConfig} = stackConfig;

  if (!customDomainConfig) {
    return;
  }

  const {
    hostedZoneId,
    hostedZoneName,
    aliasRecordName,
    aliasRecordTtlInSeconds,
  } = customDomainConfig;

  const constructorName = type === `a` ? `ARecord` : `AaaaRecord`;

  const record = new aws_route53[constructorName](stack, constructorName, {
    zone: aws_route53.HostedZone.fromHostedZoneAttributes(
      stack,
      `${constructorName}HostedZoneLookup`,
      {hostedZoneId, zoneName: hostedZoneName},
    ),
    recordName: aliasRecordName,
    target: aws_route53.RecordTarget.fromAlias(
      new aws_route53_targets.ApiGateway(restApi),
    ),
    ttl:
      aliasRecordTtlInSeconds !== undefined
        ? Duration.seconds(aliasRecordTtlInSeconds)
        : undefined,
  });

  record.node.addDependency(restApi);
}
