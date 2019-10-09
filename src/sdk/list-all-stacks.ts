import {CloudFormation} from 'aws-sdk';
import chalk from 'chalk';
import createUi from 'cliui';
import {Context} from '../context';
import {createClientConfig} from './create-client-config';
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
  context: Context,
  profile: string
): Promise<void> {
  const clientConfig = await createClientConfig(
    profile,
    context.appConfig.region
  );

  const cloudFormation = new CloudFormation(clientConfig);
  const stacks = await findAllStacks(context, cloudFormation);

  for (const stack of stacks.sort(compareLastUpdatedTimes)) {
    if (stack.DeletionTime) {
      continue;
    }

    const ui = createUi({wrap: true});
    const padding: [number, number, number, number] = [0, 1, 0, 0];

    ui.div(
      {text: chalk.bold('Stack Name'), border: true, padding},
      {text: chalk.bold('Last Updated'), border: true, padding},
      {text: chalk.bold('Tags'), border: true}
    );

    const {StackName, Tags} = stack;

    ui.div(
      {text: context.parseStackName(StackName), padding},
      {text: getLastUpdatedTime(stack).toString(), padding},
      Tags && Tags.length > 0 ? Tags.map(({Key}) => Key).join(', ') : ''
    );

    console.info(ui.toString());
  }
}
