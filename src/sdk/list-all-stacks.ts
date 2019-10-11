import {CloudFormation} from 'aws-sdk';
import {Context} from '../context';
import {printStacksTable} from '../utils/print-stacks-table';
import {createClientConfig} from './create-client-config';
import {findAllStacks} from './find-all-stacks';

export async function listAllStacks(context: Context): Promise<void> {
  const cloudFormation = new CloudFormation(await createClientConfig());
  const stacks = await findAllStacks(context, cloudFormation);

  if (stacks.length === 0) {
    console.info(`No stacks found of app: ${context.appConfig.appName}`);
  } else {
    printStacksTable(context, stacks.filter(({DeletionTime}) => !DeletionTime));
  }
}
