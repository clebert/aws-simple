import type {Stack} from '@aws-sdk/client-cloudformation';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';

export async function findStacks(): Promise<readonly Stack[]> {
  const client = new CloudFormationClient({});
  const stacks: Stack[] = [];

  let nextToken: string | undefined;

  do {
    const output = await client.send(
      new DescribeStacksCommand({NextToken: nextToken}),
    );

    if (output.Stacks) {
      stacks.push(...output.Stacks);
    }

    nextToken = output.NextToken;
  } while (nextToken);

  return stacks.filter(({StackName}) => StackName?.startsWith(`aws-simple`));
}
