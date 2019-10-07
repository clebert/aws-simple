import {CloudFormation} from 'aws-sdk';
import {DeploymentDescriptor} from '../utils/deployment-descriptor';

export async function findStack(
  deploymentDescriptor: DeploymentDescriptor,
  cloudFormation: CloudFormation
): Promise<CloudFormation.Stack> {
  const {resourceIds} = deploymentDescriptor;

  const result = await cloudFormation
    .describeStacks({StackName: resourceIds.stack})
    .promise();

  const stack = result.Stacks && result.Stacks[0];

  if (!stack) {
    throw new Error(`Stack not found: ${resourceIds.stack}`);
  }

  return stack;
}
