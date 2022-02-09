import type yargs from 'yargs';
import {printConfirmation, printInfo, printSuccess, printWarning} from './cli';
import {readStackConfig} from './read-stack-config';
import {deleteStack} from './sdk/delete-stack';
import {getDomainName} from './utils/get-domain-name';
import {getStackName} from './utils/get-stack-name';

export interface DeleteArgs {
  readonly yes: boolean;
}

const command: yargs.BuilderCallback<{}, {}> = (argv) =>
  argv
    .describe(`yes`, `Confirm the deletion`)
    .boolean(`yes`)
    .default(`yes`, false)

    .example(`npx $0 delete`, ``)
    .example(`npx $0 delete --yes`, ``);

export async function delete_(args: DeleteArgs): Promise<void> {
  const stackName = getStackName(getDomainName(readStackConfig()));

  if (args.yes) {
    printWarning(`The stack will be deleted: ${stackName}`);
  } else {
    const confirmed = await printConfirmation(
      `Confirm to delete the stack: ${stackName}`,
    );

    if (!confirmed) {
      return;
    }
  }

  printInfo(`The deletion process is running...`);

  await deleteStack(stackName);

  printSuccess(`The stack was successfully deleted.`);
}

delete_.command = command;
