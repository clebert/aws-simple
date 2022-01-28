import type {Stack} from 'aws-cdk-lib';
import {aws_apigateway} from 'aws-cdk-lib';
import type {StackConfig} from '../../types';
import {createDomainNameOptions} from './create-domain-name-options';
import {createStageOptions} from './create-stage-options';

export function createRestApiProps(
  resourceName: string,
  stackConfig: StackConfig,
  stack: Stack,
): aws_apigateway.RestApiProps {
  const {binaryMediaTypes, minimumCompressionSizeInBytes, enableCors} =
    stackConfig;

  return {
    restApiName: resourceName,
    domainName: createDomainNameOptions(stackConfig, stack),
    disableExecuteApiEndpoint: true,
    binaryMediaTypes,
    minimumCompressionSize: minimumCompressionSizeInBytes,
    deployOptions: createStageOptions(stackConfig),
    defaultCorsPreflightOptions: enableCors
      ? {
          allowOrigins: aws_apigateway.Cors.ALL_ORIGINS,
          allowCredentials: true,
        }
      : undefined,
  };
}
