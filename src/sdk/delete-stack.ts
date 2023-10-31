import {
  CloudFormationClient,
  DeleteStackCommand,
  waitUntilStackDeleteComplete,
} from '@aws-sdk/client-cloudformation';

export async function deleteStack(stackName: string): Promise<void> {
  const client = new CloudFormationClient({});

  await client.send(new DeleteStackCommand({ StackName: stackName }));

  await waitUntilStackDeleteComplete(
    { client, maxWaitTime: 600, minDelay: 30, maxDelay: 30 },
    { StackName: stackName },
  );
}
