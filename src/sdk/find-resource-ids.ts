import {
  CloudFormationClient,
  paginateListStackResources,
} from '@aws-sdk/client-cloudformation';

export async function findResourceIds(
  stackName: string,
): Promise<readonly string[]> {
  const client = new CloudFormationClient({});
  const resourceIds: string[] = [];

  const paginator = paginateListStackResources(
    {client},
    {StackName: stackName},
  );

  for await (const output of paginator) {
    if (output.StackResourceSummaries) {
      for (const {PhysicalResourceId} of output.StackResourceSummaries) {
        if (PhysicalResourceId) {
          resourceIds.push(PhysicalResourceId);
        }
      }
    }
  }

  return resourceIds;
}
