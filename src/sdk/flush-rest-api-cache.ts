import { APIGatewayClient, FlushStageCacheCommand } from '@aws-sdk/client-api-gateway';

export async function flushRestApiCache(restApiId: string): Promise<void> {
  const client = new APIGatewayClient({});

  await client.send(new FlushStageCacheCommand({ restApiId, stageName: `prod` }));
}
