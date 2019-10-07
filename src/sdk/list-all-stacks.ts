import {CloudFormation} from 'aws-sdk';
import {DeploymentDescriptor} from '../utils/deployment-descriptor';
import {SdkConfig, createClientConfig} from './create-client-config';
import {findAllStacks} from './find-all-stacks';

export async function listAllStacks(
  deploymentDescriptor: DeploymentDescriptor,
  sdkConfig: SdkConfig
): Promise<void> {
  const clientConfig = await createClientConfig(sdkConfig);
  const cloudFormation = new CloudFormation(clientConfig);
  const stacks = await findAllStacks(deploymentDescriptor, cloudFormation);

  for (const stack of stacks) {
    console.log(stack.StackName);
  }
}
