import {CloudFormation} from 'aws-sdk';

export async function updateStackTags(
  clientConfig: CloudFormation.ClientConfiguration,
  stack: CloudFormation.Stack,
  tagsToAdd: string[],
  tagsToRemove: string[]
): Promise<void> {
  const {StackName, Capabilities, Parameters, Tags = []} = stack;

  const tagObjects = [
    ...Tags,
    ...tagsToAdd
      .filter(tag => Tags.every(({Key}) => Key !== tag))
      .map(tag => ({Key: tag, Value: 'true'}))
  ].filter(({Key}) => !tagsToRemove.includes(Key));

  const cloudFormation = new CloudFormation(clientConfig);

  await cloudFormation
    .updateStack({
      StackName,
      UsePreviousTemplate: true,
      Capabilities,
      Parameters,
      Tags: tagObjects
    })
    .promise();

  await cloudFormation
    .waitFor('stackUpdateComplete', {
      StackName,
      $waiter: {delay: 5, maxAttempts: 60}
    })
    .promise();
}
