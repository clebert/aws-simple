import {CloudFormation} from 'aws-sdk';
import {Context} from '../context';

export async function findStack(
  context: Context,
  cloudFormation: CloudFormation
): Promise<CloudFormation.Stack> {
  const result = await cloudFormation
    .describeStacks({StackName: context.getResourceId('stack')})
    .promise();

  const stack = result.Stacks && result.Stacks[0];

  if (!stack) {
    throw new Error(`Stack not found: ${context.getResourceId('stack')}`);
  }

  return stack;
}
