import {CloudFormation} from 'aws-sdk';
import {DeploymentDescriptor} from '../deployment-descriptor';

export async function findAllStacks(
  deploymentDescriptor: DeploymentDescriptor,
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
    StackName.startsWith(deploymentDescriptor.appConfig.appName)
  );
}
