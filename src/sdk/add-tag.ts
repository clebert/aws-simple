import {CloudFormation} from 'aws-sdk';
import {DeploymentDescriptor} from '../utils/deployment-descriptor';
import {createClientConfig} from './create-client-config';
import {findStack} from './find-stack';

export async function addTag(
  deploymentDescriptor: DeploymentDescriptor,
  profile: string,
  tagName: string
): Promise<void> {
  const clientConfig = await createClientConfig(
    profile,
    deploymentDescriptor.appConfig.region
  );

  const cloudFormation = new CloudFormation(clientConfig);

  const {Capabilities, Parameters, Tags = []} = await findStack(
    deploymentDescriptor,
    cloudFormation
  );

  await cloudFormation
    .updateStack({
      StackName: deploymentDescriptor.resourceIds.stack,
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
      StackName: deploymentDescriptor.resourceIds.stack,
      $waiter: {
        delay: delayInSeconds,
        maxAttempts: totalDurationInSeconds / delayInSeconds
      }
    })
    .promise();
}
