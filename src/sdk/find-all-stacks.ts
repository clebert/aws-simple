import {CloudFormation} from 'aws-sdk';
import {Context} from '../context';

export async function findAllStacks(
  context: Context,
  cloudFormation: CloudFormation
): Promise<CloudFormation.Stack[]> {
  const stacks: CloudFormation.Stack[] = [];

  let stackDescriptions: CloudFormation.DescribeStacksOutput | undefined;

  do {
    stackDescriptions = await cloudFormation
      .describeStacks({
        NextToken: stackDescriptions && stackDescriptions.NextToken
      })
      .promise();

    if (stackDescriptions.Stacks) {
      stacks.push(...stackDescriptions.Stacks);
    }
  } while (stackDescriptions.NextToken);

  return stacks.filter(({StackName}) =>
    StackName.startsWith(context.appConfig.appName)
  );
}
