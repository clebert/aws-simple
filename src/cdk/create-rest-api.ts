import type {Stack} from 'aws-cdk-lib';
import {CfnOutput} from 'aws-cdk-lib';
import type {RestApiBase, StageOptions} from 'aws-cdk-lib/aws-apigateway';
import {
  EndpointType,
  RestApi,
  SecurityPolicy,
} from 'aws-cdk-lib/aws-apigateway';
import type {ICertificate} from 'aws-cdk-lib/aws-certificatemanager';

export interface RestApiInit {
  readonly stack: Stack;
  readonly certificate: ICertificate;
  readonly restApiName: string;
  readonly domainName: string;
  readonly stageOptions: StageOptions;
}

export function createRestApi(init: RestApiInit): RestApiBase {
  const {stack, certificate, restApiName, domainName, stageOptions} = init;

  const restApi = new RestApi(stack, `RestApi`, {
    endpointTypes: [EndpointType.REGIONAL],
    restApiName,
    domainName: {
      endpointType: EndpointType.REGIONAL,
      domainName,
      certificate,
      securityPolicy: SecurityPolicy.TLS_1_2,
    },
    disableExecuteApiEndpoint: true,
    binaryMediaTypes: [`*/*`],
    minimumCompressionSize: 150,
    deployOptions: stageOptions,
  });

  new CfnOutput(stack, `RestApiIdOutput`, {
    value: restApi.restApiId,
  }).node.addDependency(restApi);

  return restApi;
}
