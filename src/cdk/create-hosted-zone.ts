import type {IHostedZone} from 'aws-cdk-lib/aws-route53';
import {HostedZone} from 'aws-cdk-lib/aws-route53';
import type {Stack} from 'aws-cdk-lib/core';
import {CfnOutput} from 'aws-cdk-lib/core';

export interface HostedZoneInit {
  readonly stack: Stack;
  readonly hostedZoneName: string;
}

export function createHostedZone(init: HostedZoneInit): IHostedZone {
  const {stack, hostedZoneName} = init;

  new CfnOutput(stack, `HostedZoneNameOutput`, {value: hostedZoneName});

  return HostedZone.fromLookup(stack, `HostedZoneLookup`, {
    domainName: hostedZoneName,
  });
}
