import type {CloudFormation} from 'aws-sdk';
import {APIGateway} from 'aws-sdk';
import {findStackOutput} from './find-stack-output';

export async function flushRestApiCache(
  clientConfig: CloudFormation.ClientConfiguration,
  stack: CloudFormation.Stack,
): Promise<void> {
  const restApiId = findStackOutput(stack, `RestApiId`);
  const apiGateway = new APIGateway(clientConfig);

  await apiGateway.flushStageCache({restApiId, stageName: `prod`}).promise();
}
