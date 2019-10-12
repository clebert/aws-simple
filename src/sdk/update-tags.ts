import {CloudFormation} from 'aws-sdk';
import Listr from 'listr';
import {Context} from '../context';
import {createClientConfig} from './create-client-config';
import {findStack} from './find-stack';

export async function updateTags(
  context: Context,
  tagsToAdd: string[],
  tagsToRemove: string[]
): Promise<void> {
  const cloudFormation = new CloudFormation(await createClientConfig());

  const {Capabilities, Parameters, Tags = []} = await findStack(
    context,
    cloudFormation
  );

  const tagObjects = [
    ...Tags,
    ...tagsToAdd
      .filter(tag => Tags.every(({Key}) => Key !== tag))
      .map(tag => ({Key: tag, Value: 'true'}))
  ].filter(({Key}) => !tagsToRemove.includes(Key));

  await cloudFormation
    .updateStack({
      StackName: context.getResourceId('stack'),
      UsePreviousTemplate: true,
      Capabilities,
      Parameters,
      Tags: tagObjects
    })
    .promise();

  await new Listr(
    [
      {
        title: 'Completing stack update',
        task: async (_, listrTask) => {
          try {
            await cloudFormation
              .waitFor('stackUpdateComplete', {
                StackName: context.getResourceId('stack'),
                $waiter: {delay: 5, maxAttempts: 60}
              })
              .promise();

            listrTask.title = 'Successfully completed stack update';
          } catch (error) {
            listrTask.title = 'Error while completing stack update';

            throw error;
          }
        }
      }
    ],
    {exitOnError: false}
  ).run();
}
