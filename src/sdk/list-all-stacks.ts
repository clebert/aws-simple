import {CloudFormation} from 'aws-sdk';
import chalk from 'chalk';
import createUi from 'cliui';
import {DeploymentDescriptor} from '../utils/deployment-descriptor';
import {SdkConfig, createClientConfig} from './create-client-config';
import {findAllStacks} from './find-all-stacks';

function getLastUpdatedTime(stack: CloudFormation.Stack): Date {
  return stack.LastUpdatedTime || stack.CreationTime;
}

function compareLastUpdatedTimes(
  stack1: CloudFormation.Stack,
  stack2: CloudFormation.Stack
): number {
  return (
    getLastUpdatedTime(stack2).getTime() - getLastUpdatedTime(stack1).getTime()
  );
}

export async function listAllStacks(
  deploymentDescriptor: DeploymentDescriptor,
  sdkConfig: SdkConfig
): Promise<void> {
  const clientConfig = await createClientConfig(sdkConfig);
  const cloudFormation = new CloudFormation(clientConfig);
  const stacks = await findAllStacks(deploymentDescriptor, cloudFormation);

  for (const stack of stacks.sort(compareLastUpdatedTimes)) {
    if (stack.DeletionTime) {
      continue;
    }

    const ui = createUi({wrap: true});
    const padding: [number, number, number, number] = [0, 1, 0, 0];

    ui.div(
      {text: chalk.bold('Stack ID'), border: true, padding},
      {text: chalk.bold('Last Updated'), border: true, padding},
      {text: chalk.bold('Tags'), border: true}
    );

    const {StackName, Tags} = stack;

    ui.div(
      {text: StackName, padding},
      {text: getLastUpdatedTime(stack).toString(), padding},
      Tags && Tags.length > 0 ? Tags.map(({Key}) => Key).join(', ') : ''
    );

    console.info(ui.toString());
  }
}
