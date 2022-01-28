import type {Stack} from 'aws-cdk-lib';
import {aws_route53} from 'aws-cdk-lib';
import {aws_apigateway, aws_certificatemanager} from 'aws-cdk-lib';
import type {StackConfig} from '../../types';

export function createDomainNameOptions(
  stackConfig: StackConfig,
  stack: Stack,
): aws_apigateway.DomainNameOptions {
  const {customDomainConfig} = stackConfig;
  const {certificateArn, hostedZoneName, aliasRecordName} = customDomainConfig;

  const domainName = aliasRecordName
    ? `${aliasRecordName}.${hostedZoneName}`
    : hostedZoneName;

  const certificate = certificateArn
    ? aws_certificatemanager.Certificate.fromCertificateArn(
        stack,
        `Certificate`,
        certificateArn,
      )
    : new aws_certificatemanager.DnsValidatedCertificate(
        stack,
        `DnsValidatedCertificate`,
        {
          domainName,
          hostedZone: aws_route53.HostedZone.fromLookup(
            stack,
            `CertificateHostedZoneLookup`,
            {domainName: hostedZoneName},
          ),
        },
      );

  return {
    domainName,
    certificate,
    securityPolicy: aws_apigateway.SecurityPolicy.TLS_1_2,
  };
}
