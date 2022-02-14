import {
  APIGatewayClient,
  CreateDeploymentCommand,
  UpdateStageCommand,
} from '@aws-sdk/client-api-gateway';

export async function redeployRestApi(restApiId: string): Promise<void> {
  const client = new APIGatewayClient({});

  const {id} = await client.send(
    new CreateDeploymentCommand({
      restApiId,
      stageName: `prod`,
      description: `aws-simple redeployment`,
    }),
  );

  await client.send(
    new UpdateStageCommand({
      restApiId,
      stageName: `prod`,
      patchOperations: [{op: `replace`, path: `/deploymentId`, value: id}],
    }),
  );
}
