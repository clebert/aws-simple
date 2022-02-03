import type {ICertificate} from 'aws-cdk-lib/aws-certificatemanager';
import {DnsValidatedCertificate} from 'aws-cdk-lib/aws-certificatemanager';
import type {IHostedZone} from 'aws-cdk-lib/aws-route53';
import type {Stack} from 'aws-cdk-lib/core';

export interface CertificateInit {
  readonly stack: Stack;
  readonly hostedZone: IHostedZone;
  readonly domainName: string;
}

export function createCertificate(init: CertificateInit): ICertificate {
  const {stack, domainName, hostedZone} = init;

  return new DnsValidatedCertificate(stack, `DnsValidatedCertificate`, {
    domainName,
    hostedZone,
  });
}
