import {DomainNameOptions} from '@aws-cdk/aws-apigateway';
import {Certificate} from '@aws-cdk/aws-certificatemanager';
import {Stack} from '@aws-cdk/core';
import {StackConfig} from '../../types';
import {createShortHash} from '../../utils/create-short-hash';

export function createDomainNameOptions(
  stackConfig: StackConfig,
  stack: Stack
): DomainNameOptions | undefined {
  const {customDomainConfig} = stackConfig;

  if (!customDomainConfig) {
    return;
  }

  const {certificateArn, hostedZoneName, aliasRecordName} = customDomainConfig;

  return {
    domainName: aliasRecordName
      ? `${aliasRecordName}.${hostedZoneName}`
      : hostedZoneName,
    certificate: Certificate.fromCertificateArn(
      stack,
      createShortHash('Certificate'),
      certificateArn
    )
  };
}
