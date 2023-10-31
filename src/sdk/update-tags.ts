import {findStack} from './find-stack.js';
import {CloudFormationClient, UpdateStackCommand} from '@aws-sdk/client-cloudformation';

export interface UpdateTagsOptions {
  readonly stackName: string;
  readonly tagsToAdd: [string, string | undefined][];
  readonly tagKeysToRemove: string[];
}

export async function updateTags(options: UpdateTagsOptions): Promise<void> {
  const {stackName, tagsToAdd, tagKeysToRemove} = options;
  const stack = await findStack(stackName);
  const client = new CloudFormationClient({});

  const tagObjects = [
    ...(stack.Tags ?? []).filter(({Key}) => tagsToAdd.every(([key]) => key !== Key)),
    ...tagsToAdd.map(([key, value]) => ({Key: key, Value: value || `true`})),
  ].filter(({Key}) => Key && !tagKeysToRemove.includes(Key));

  await client.send(
    new UpdateStackCommand({
      StackName: stackName,
      UsePreviousTemplate: true,
      Capabilities: stack.Capabilities,
      Parameters: stack.Parameters,
      Tags: tagObjects,
    }),
  );
}
