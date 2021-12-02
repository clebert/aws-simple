import type {Stack, aws_apigateway} from 'aws-cdk-lib';
import {Duration, aws_route53, aws_route53_targets} from 'aws-cdk-lib';
import type {StackConfig} from '../../types';

export function createARecord(
  stackConfig: StackConfig,
  stack: Stack,
  restApi: aws_apigateway.RestApi
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

  const aRecord = new aws_route53.ARecord(stack, `ARecord`, {
    zone: aws_route53.HostedZone.fromHostedZoneAttributes(stack, `HostedZone`, {
      hostedZoneId,
      zoneName: hostedZoneName,
    }),
    recordName: aliasRecordName,
    target: aws_route53.RecordTarget.fromAlias(
      new aws_route53_targets.ApiGateway(restApi)
    ),
    ttl:
      aliasRecordTtlInSeconds !== undefined
        ? Duration.seconds(aliasRecordTtlInSeconds)
        : undefined,
  });

  aRecord.node.addDependency(restApi);
}
