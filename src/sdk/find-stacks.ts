import type {Stack} from '@aws-sdk/client-cloudformation';

import {findStack} from './find-stack.js';
import {getOutputValue} from './get-output-value.js';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';

export async function findStacks(
  hostedZoneName?: string,
): Promise<readonly Stack[]> {
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

  return Promise.all(
    stacks
      .filter((stack) => isMatchingStack(stack, hostedZoneName))
      // For some reason `stack.EnableTerminationProtection` is always
      // `undefined`. Describing a single stack instead, does return the correct
      // value (true or false) for `EnableTerminationProtection`.
      .map(async ({StackName}) => findStack(StackName!)),
  );
}

function isMatchingStack(
  stack: Stack,
  hostedZoneName: string | undefined,
): boolean {
  if (!stack.StackName?.startsWith(`aws-simple`)) {
    return false;
  }

  if (!hostedZoneName) {
    return true;
  }

  return getOutputValue(stack, `HostedZoneName`) === hostedZoneName;
}
