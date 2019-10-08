import {CloudFormation} from 'aws-sdk';
import {Context} from '../context';

export async function findStack(
  context: Context,
  cloudFormation: CloudFormation
): Promise<CloudFormation.Stack> {
  const {resourceIds} = context;

  const result = await cloudFormation
    .describeStacks({StackName: resourceIds.stack})
    .promise();

  const stack = result.Stacks && result.Stacks[0];

  if (!stack) {
    throw new Error(`Stack not found: ${resourceIds.stack}`);
  }

  return stack;
}
