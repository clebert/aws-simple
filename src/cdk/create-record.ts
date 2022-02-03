import {aws_route53} from 'aws-cdk-lib';
import type {RestApiBase} from 'aws-cdk-lib/aws-apigateway';
import type {IHostedZone, IRecordSet} from 'aws-cdk-lib/aws-route53';
import {RecordTarget} from 'aws-cdk-lib/aws-route53';
import {ApiGateway} from 'aws-cdk-lib/aws-route53-targets';
import type {Stack} from 'aws-cdk-lib/core';

export interface RecordInit {
  readonly stack: Stack;
  readonly hostedZone: IHostedZone;
  readonly restApi: RestApiBase;
  readonly type: 'A' | 'AAAA';
  readonly subdomainName: string;
}

export function createRecord(init: RecordInit): IRecordSet {
  const {stack, hostedZone, restApi, type, subdomainName} = init;
  const constructorName = type === `A` ? `ARecord` : `AaaaRecord`;

  const record = new aws_route53[constructorName](stack, constructorName, {
    zone: hostedZone,
    recordName: subdomainName,
    target: RecordTarget.fromAlias(new ApiGateway(restApi)),
  });

  record.node.addDependency(restApi);

  return record;
}
