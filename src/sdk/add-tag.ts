import {CloudFormation} from 'aws-sdk';
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

  console.info('Waiting for the stack update to be completed...');

  const delayInSeconds = 5;
  const totalDurationInSeconds = 60 * 5;

  await cloudFormation
    .waitFor('stackUpdateComplete', {
      StackName: resourceIds.stack,
      $waiter: {
        delay: delayInSeconds,
        maxAttempts: totalDurationInSeconds / delayInSeconds
      }
    })
    .promise();
}
