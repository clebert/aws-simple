import type {Stack} from '@aws-sdk/client-cloudformation';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {findStack} from './find-stack';
import {getOutputValue} from './get-output-value';

export interface FindStacksOptions {
  readonly hostedZoneName: string;
  readonly legacyAppName?: string;
}

export async function findStacks(
  options?: FindStacksOptions,
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
      .filter((stack) => isMatchingStack(stack, options))
      // For some reason `stack.EnableTerminationProtection` is always
      // `undefined`. Describing a single stack instead, does return the correct
      // value (true or false) for `EnableTerminationProtection`.
      .map(async ({StackName}) => findStack(StackName!)),
  );
}

function isMatchingStack(
  stack: Stack,
  options: FindStacksOptions | undefined,
): boolean {
  if (!stack.StackName?.startsWith(`aws-simple`)) {
    return false;
  }

  if (!options) {
    return true;
  }

  const {hostedZoneName, legacyAppName} = options;

  return Boolean(
    getOutputValue(stack, `HostedZoneName`) === hostedZoneName ||
      (legacyAppName &&
        stack.StackName.startsWith(`aws-simple--${legacyAppName}--`)),
  );
}
