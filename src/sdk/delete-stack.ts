import {CloudFormation} from 'aws-sdk';

export async function deleteStack(
  clientConfig: CloudFormation.ClientConfiguration,
  stack: CloudFormation.Stack
): Promise<void> {
  const cloudFormation = new CloudFormation(clientConfig);
  const {StackName} = stack;

  await cloudFormation.deleteStack({StackName}).promise();

  await cloudFormation
    .waitFor(`stackDeleteComplete`, {
      StackName,
      $waiter: {delay: 5, maxAttempts: 3600 / 5},
    })
    .promise();
}
