import type {Stack} from '@aws-sdk/client-cloudformation';

import {findStack} from './find-stack.js';
import {getOutputValue} from './get-output-value.js';
import {
  CloudFormationClient,
  paginateDescribeStacks,
} from '@aws-sdk/client-cloudformation';

type NamedStack = Stack & {StackName: string};

export async function findStacks(
  hostedZoneName?: string,
): Promise<readonly Stack[]> {
  const client = new CloudFormationClient({});
  const stacks: NamedStack[] = [];
  const paginator = paginateDescribeStacks({client}, {});

  for await (const output of paginator) {
    if (output.Stacks) {
      for (const stack of output.Stacks) {
        if (isMatchingStack(stack, hostedZoneName)) {
          stacks.push(stack);
        }
      }
    }
  }

  return Promise.all(
    stacks
      // For some reason `stack.EnableTerminationProtection` is always
      // `undefined`. Describing a single stack instead, does return the correct
      // value (true or false) for `EnableTerminationProtection`.
      .map(async ({StackName}) => findStack(StackName)),
  );
}

function isMatchingStack(
  stack: Stack,
  hostedZoneName: string | undefined,
): stack is NamedStack {
  if (!stack.StackName?.startsWith(`aws-simple`)) {
    return false;
  }

  if (!hostedZoneName) {
    return true;
  }

  return getOutputValue(stack, `HostedZoneName`) === hostedZoneName;
}
