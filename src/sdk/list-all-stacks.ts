import {CloudFormation} from 'aws-sdk';
import {Context} from '../context';
import {printStacksTable} from '../utils/print-stacks-table';
import {createClientConfig} from './create-client-config';
import {findAllStacks} from './find-all-stacks';

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

  printStacksTable(context, stacks.filter(({DeletionTime}) => !DeletionTime));
}
