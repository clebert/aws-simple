import type {Stack} from '@aws-sdk/client-cloudformation';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
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

  const allStacks = stacks.filter(({StackName}) =>
    StackName?.startsWith(`aws-simple`),
  );

  if (!options) {
    return allStacks;
  }

  const {hostedZoneName, legacyAppName} = options;

  return allStacks.filter(
    (stack) =>
      getOutputValue(stack, `HostedZoneName`) === hostedZoneName ||
      (legacyAppName &&
        stack.StackName?.startsWith(`aws-simple--${legacyAppName}--`)),
  );
}
