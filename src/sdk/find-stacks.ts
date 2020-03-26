import {CloudFormation} from 'aws-sdk';
import {AppConfig} from '../types';
import {getAgeInDays} from '../utils/get-age-in-days';
import {parseStackName} from '../utils/stack-name';

export async function findStacks(
  appConfig: AppConfig,
  clientConfig: CloudFormation.ClientConfiguration
): Promise<CloudFormation.Stack[]> {
  const stacks: CloudFormation.Stack[] = [];

  let stackDescriptions: CloudFormation.DescribeStacksOutput | undefined;

  do {
    stackDescriptions = await new CloudFormation(clientConfig)
      .describeStacks({
        NextToken: stackDescriptions && stackDescriptions.NextToken,
      })
      .promise();

    if (stackDescriptions.Stacks) {
      stacks.push(...stackDescriptions.Stacks);
    }
  } while (stackDescriptions.NextToken);

  return stacks
    .filter(({StackName}) => {
      const parts = parseStackName(StackName);

      return parts && parts.appName === appConfig.appName;
    })
    .filter(({DeletionTime}) => !DeletionTime)
    .sort(
      (stack1, stack2) =>
        getAgeInDays(stack1.CreationTime) - getAgeInDays(stack2.CreationTime)
    );
}
