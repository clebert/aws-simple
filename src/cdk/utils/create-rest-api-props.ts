import {RestApiProps} from '@aws-cdk/aws-apigateway';
import {Stack} from '@aws-cdk/core';
import {AppConfig} from '../../types';
import {createDomainNameOptions} from './create-domain-name-options';
import {createStageOptions} from './create-stage-options';

export function createRestApiProps(
  appConfig: AppConfig,
  stack: Stack
): RestApiProps {
  const {binaryMediaTypes, minimumCompressionSizeInBytes} = appConfig;

  return {
    domainName: createDomainNameOptions(appConfig, stack),
    binaryMediaTypes,
    minimumCompressionSize: minimumCompressionSizeInBytes,
    deployOptions: createStageOptions(appConfig)
  };
}
