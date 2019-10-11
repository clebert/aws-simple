import {CloudFormation} from 'aws-sdk';
import Listr from 'listr';
import {Context} from '../context';
import {createClientConfig} from './create-client-config';
import {findStack} from './find-stack';

export async function addTag(context: Context, tagName: string): Promise<void> {
  const clientConfig = await createClientConfig(context);
  const cloudFormation = new CloudFormation(clientConfig);

  const {Capabilities, Parameters, Tags = []} = await findStack(
    context,
    cloudFormation
  );

  await cloudFormation
    .updateStack({
      StackName: context.getResourceId('stack'),
      UsePreviousTemplate: true,
      Capabilities,
      Parameters,
      Tags: [...Tags, {Key: tagName, Value: 'true'}]
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
