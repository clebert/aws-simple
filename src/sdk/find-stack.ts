import {CloudFormation} from 'aws-sdk';
import type {AppConfig} from '../types';
import {createStackName} from '../utils/stack-name';

export async function findStack(
  appConfig: AppConfig,
  clientConfig: CloudFormation.ClientConfiguration
): Promise<CloudFormation.Stack> {
  const stackName = createStackName(appConfig);

  const result = await new CloudFormation(clientConfig)
    .describeStacks({StackName: stackName})
    .promise();

  const stack = result.Stacks && result.Stacks[0];

  if (!stack) {
    throw new Error(`Stack (${stackName}) not found.`);
  }

  return stack;
}
