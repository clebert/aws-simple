import {
  CloudFormationClient,
  ListStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';

export async function findResourceIds(
  stackName: string,
): Promise<readonly string[]> {
  const client = new CloudFormationClient({});
  const resourceIds: string[] = [];

  let nextToken: string | undefined;

  do {
    const output = await client.send(
      new ListStackResourcesCommand({
        StackName: stackName,
        NextToken: nextToken,
      }),
    );

    if (output.StackResourceSummaries) {
      for (const {PhysicalResourceId} of output.StackResourceSummaries) {
        if (PhysicalResourceId) {
          resourceIds.push(PhysicalResourceId);
        }
      }
    }

    nextToken = output.NextToken;
  } while (nextToken);

  return resourceIds;
}
