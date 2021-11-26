import {Stack, aws_apigateway, aws_certificatemanager} from 'aws-cdk-lib';
import {StackConfig} from '../../types';

export function createDomainNameOptions(
  stackConfig: StackConfig,
  stack: Stack
): aws_apigateway.DomainNameOptions | undefined {
  const {customDomainConfig} = stackConfig;

  if (!customDomainConfig) {
    return;
  }

  const {certificateArn, hostedZoneName, aliasRecordName} = customDomainConfig;

  return {
    domainName: aliasRecordName
      ? `${aliasRecordName}.${hostedZoneName}`
      : hostedZoneName,
    certificate: aws_certificatemanager.Certificate.fromCertificateArn(
      stack,
      'Certificate',
      certificateArn
    ),
    securityPolicy: aws_apigateway.SecurityPolicy.TLS_1_2,
  };
}
