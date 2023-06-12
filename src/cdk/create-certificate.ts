import type {Stack, aws_route53} from 'aws-cdk-lib';

import {aws_certificatemanager} from 'aws-cdk-lib';

type CreateCertificateOptions = {
  certificateArn?: string;
  domainName: string;
  hostedZone: aws_route53.IHostedZone;
  stack: Stack;
};

export function createCertificate({
  certificateArn,
  domainName,
  hostedZone,
  stack,
}: CreateCertificateOptions): aws_certificatemanager.ICertificate {
  if (certificateArn) {
    return aws_certificatemanager.Certificate.fromCertificateArn(
      stack,
      `CertificateArn`,
      certificateArn,
    );
  }

  return new aws_certificatemanager.Certificate(stack, `Certificate`, {
    domainName,
    validation:
      aws_certificatemanager.CertificateValidation.fromDns(hostedZone),
  });
}
