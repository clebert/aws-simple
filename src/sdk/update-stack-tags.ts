import {CloudFormation} from 'aws-sdk';

export interface Tag {
  readonly key: string;
  readonly value?: string;
}

export async function updateStackTags(
  clientConfig: CloudFormation.ClientConfiguration,
  stack: CloudFormation.Stack,
  tagsToAdd: Tag[],
  tagsToRemove: string[],
): Promise<void> {
  const {StackName, Capabilities, Parameters, Tags = []} = stack;

  const tagObjects = [
    ...Tags.filter(({Key}) => tagsToAdd.every((tag) => tag.key !== Key)),
    ...tagsToAdd.map((tag) => ({Key: tag.key, Value: tag.value || `true`})),
  ].filter(({Key}) => !tagsToRemove.includes(Key));

  const cloudFormation = new CloudFormation(clientConfig);

  await cloudFormation
    .updateStack({
      StackName,
      UsePreviousTemplate: true,
      Capabilities,
      Parameters,
      Tags: tagObjects,
    })
    .promise();

  await cloudFormation
    .waitFor(`stackUpdateComplete`, {
      StackName,
      $waiter: {delay: 5, maxAttempts: 60},
    })
    .promise();
}
