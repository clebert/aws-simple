import {CloudFormation} from 'aws-sdk';
import Listr from 'listr';
import {Context} from '../context';
import {createClientConfig} from './create-client-config';
import {findStack} from './find-stack';

export async function addTag(
  context: Context,
  profile: string,
  tagName: string
): Promise<void> {
  const {appConfig, resourceIds} = context;
  const clientConfig = await createClientConfig(profile, appConfig.region);
  const cloudFormation = new CloudFormation(clientConfig);

  const {Capabilities, Parameters, Tags = []} = await findStack(
    context,
    cloudFormation
  );

  await cloudFormation
    .updateStack({
      StackName: resourceIds.stack,
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
                StackName: resourceIds.stack,
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
