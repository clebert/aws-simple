import type {Stack} from 'aws-cdk-lib';
import {aws_route53} from 'aws-cdk-lib';
import {aws_apigateway, aws_certificatemanager} from 'aws-cdk-lib';
import type {StackConfig} from '../../types';
import {getFullyQualifiedDomainName} from '../../utils/get-fully-qualified-domain-name';

export function createDomainNameOptions(
  stackConfig: StackConfig,
  stack: Stack,
): aws_apigateway.DomainNameOptions {
  const {customDomainConfig} = stackConfig;
  const {certificateArn, hostedZoneName} = customDomainConfig;
  const domainName = getFullyQualifiedDomainName(stackConfig);

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
