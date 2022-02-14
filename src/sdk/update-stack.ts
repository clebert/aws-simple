import {
  CloudFormationClient,
  UpdateStackCommand,
  waitUntilStackUpdateComplete,
} from '@aws-sdk/client-cloudformation';
import {findStack} from './find-stack';

export interface UpdateStackOptions {
  readonly tagsToAdd?: readonly Tag[];
  readonly tagKeysToRemove?: readonly string[];
}

export interface Tag {
  readonly key: string;
  readonly value: string;
}

export async function updateStack(
  stackName: string,
  options: UpdateStackOptions,
): Promise<void> {
  const client = new CloudFormationClient({});
  const {Capabilities, Parameters, Tags = []} = await findStack(stackName);
  const {tagsToAdd = [], tagKeysToRemove = []} = options;

  const tags = [
    ...Tags.filter(({Key}) => tagsToAdd.every(({key}) => key !== Key)),
    ...tagsToAdd.map(({key, value}) => ({Key: key, Value: value})),
  ].filter(({Key}) => !tagKeysToRemove.includes(Key!));

  await client.send(
    new UpdateStackCommand({
      StackName: stackName,
      UsePreviousTemplate: true,
      Capabilities,
      Parameters,
      Tags: tags,
    }),
  );

  await waitUntilStackUpdateComplete(
    {client, maxWaitTime: 300, minDelay: 15, maxDelay: 15},
    {StackName: stackName},
  );
}
