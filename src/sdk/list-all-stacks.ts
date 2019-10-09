import {CloudFormation} from 'aws-sdk';
import {Context} from '../context';
import {printStacksTable} from '../utils/print-stacks-table';
import {createClientConfig} from './create-client-config';
import {findAllStacks} from './find-all-stacks';

export async function listAllStacks(
  context: Context,
  profile: string
): Promise<void> {
  const {appName, region} = context.appConfig;
  const clientConfig = await createClientConfig(profile, region);
  const cloudFormation = new CloudFormation(clientConfig);
  const stacks = await findAllStacks(context, cloudFormation);

  if (stacks.length === 0) {
    console.info(`No stacks found of app: ${appName}`);
  } else {
    printStacksTable(context, stacks.filter(({DeletionTime}) => !DeletionTime));
  }
}
