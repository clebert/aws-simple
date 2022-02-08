import type {Stack} from '@aws-sdk/client-cloudformation';
import type {StackConfig} from '../get-stack-config';
import {getDomainName} from '../utils/get-absolute-domain-name';
import {getStackName} from '../utils/get-stack-name';
import {findStacks} from './find-stacks';

export async function findStack(stackConfig: StackConfig): Promise<Stack> {
  const stackName = getStackName(getDomainName(stackConfig));

  const stack = (await findStacks()).find(
    ({StackName}) => StackName === stackName,
  );

  if (!stack) {
    throw new Error(`The stack cannot be found: ${stackName}`);
  }

  return stack;
}
