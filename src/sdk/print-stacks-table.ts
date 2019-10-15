import {CloudFormation} from 'aws-sdk';
import chalk from 'chalk';
import createUi from 'cliui';
import {getAgeInDays} from '../utils/get-age-in-days';
import {parseStackName} from '../utils/stack-name';

function compareAge(
  stack1: CloudFormation.Stack,
  stack2: CloudFormation.Stack
): number {
  return getAgeInDays(stack1.CreationTime) - getAgeInDays(stack2.CreationTime);
}

export function printStacksTable(stacks: CloudFormation.Stack[]): void {
  const ui = createUi({wrap: true});
  const padding: [number, number, number, number] = [0, 1, 0, 0];

  ui.div(
    {text: chalk.bold('App Version'), border: true, padding},
    {text: chalk.bold('Age'), border: true, padding, width: 11},
    {text: chalk.bold('Tags'), border: true}
  );

  for (const stack of stacks.slice(0).sort(compareAge)) {
    const {StackName, CreationTime, Tags} = stack;
    const parts = parseStackName(StackName);
    const age = getAgeInDays(CreationTime);

    ui.div(
      {text: parts ? parts.appVersion : StackName, padding},
      {text: `${age} day${age === 1 ? '' : 's'}`, padding, width: 11},
      Tags && Tags.length > 0 ? Tags.map(({Key}) => Key).join(', ') : ''
    );
  }

  console.info(ui.toString(), '\n');
}
