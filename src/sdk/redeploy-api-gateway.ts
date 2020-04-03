import {APIGateway, CloudFormation} from 'aws-sdk';
import {findStackOutput} from './find-stack-output';

const stageName = 'prod';

/**
 * https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-deployments.html
 */
export async function redeployApiGateway(
  clientConfig: CloudFormation.ClientConfiguration,
  stack: CloudFormation.Stack
): Promise<void> {
  const restApiId = findStackOutput(stack, 'RestApiId');
  const apiGateway = new APIGateway(clientConfig);

  const deployment = await apiGateway
    .createDeployment({
      restApiId,
      stageName,
      description: 'Triggered by the aws-simple redeploy command',
    })
    .promise();

  await apiGateway
    .updateStage({
      restApiId,
      stageName,
      patchOperations: [
        {op: 'replace', path: '/deploymentId', value: deployment.id},
      ],
    })
    .promise();
}
