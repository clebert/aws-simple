import {
  CloudFormationClient,
  DeleteStackCommand,
  waitUntilStackDeleteComplete,
} from '@aws-sdk/client-cloudformation';
import {deleteBucket} from './delete-bucket';
import {findStack} from './find-stack';
import {getOutputValue} from './get-output-value';

export async function deleteStack(stackName: string): Promise<void> {
  const client = new CloudFormationClient({});

  if (stackName.startsWith(`aws-simple--`)) {
    const stack = await findStack(stackName);
    const bucketName = getOutputValue(stack, `BucketName`);

    if (bucketName) {
      await deleteBucket(bucketName);
    }
  }

  await client.send(new DeleteStackCommand({StackName: stackName}));

  await waitUntilStackDeleteComplete(
    {client, maxWaitTime: 600, minDelay: 30, maxDelay: 30},
    {StackName: stackName},
  );
}
