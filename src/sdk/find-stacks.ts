import type {Stack} from '@aws-sdk/client-cloudformation';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {getOutputValue} from './get-output-value';

export interface FindStacksOptions {
  readonly domainName?: string;
  readonly legacyAppName?: string;
}

export async function findStacks(
  options: FindStacksOptions = {},
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

  const {domainName, legacyAppName} = options;

  return domainName || legacyAppName
    ? allStacks.filter(
        (stack) =>
          (domainName &&
            getOutputValue(stack, `HostedZoneName`) === domainName) ||
          (legacyAppName &&
            stack.StackName?.startsWith(`aws-simple--${legacyAppName}--`)),
      )
    : allStacks;
}
