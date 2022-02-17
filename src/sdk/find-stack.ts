import type {Stack} from '@aws-sdk/client-cloudformation';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';

export async function findStack(stackName: string): Promise<Stack> {
  const client = new CloudFormationClient({});

  const {Stacks} = await client.send(
    new DescribeStacksCommand({StackName: stackName}),
  );

  const stack = Stacks?.[0];

  if (!stack) {
    throw new Error(`The stack cannot be found: ${stackName}`);
  }

  return stack;
}
