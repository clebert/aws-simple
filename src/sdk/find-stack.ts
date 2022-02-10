import type {Stack} from '@aws-sdk/client-cloudformation';
import {findStacks} from './find-stacks';

export async function findStack(stackName: string): Promise<Stack> {
  const stack = (await findStacks()).find(
    ({StackName}) => StackName === stackName,
  );

  if (!stack) {
    throw new Error(`The searched stack cannot be found: ${stackName}`);
  }

  return stack;
}
