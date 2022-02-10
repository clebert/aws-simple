import type yargs from 'yargs';
import {readStackConfig} from './read-stack-config';
import {deleteStack} from './sdk/delete-stack';
import {getDomainName} from './utils/get-domain-name';
import {getStackName} from './utils/get-stack-name';
import {print} from './utils/print';

export interface DeleteCommandArgs {
  readonly yes: boolean;
}

const commandName = `delete`;

const builder: yargs.BuilderCallback<{}, {}> = (argv) =>
  argv
    .describe(`yes`, `Confirm the deletion automatically`)
    .boolean(`yes`)
    .default(`yes`, false)

    .example(`npx $0 ${commandName}`, ``)
    .example(`npx $0 ${commandName} --yes`, ``);

export async function deleteCommand(args: DeleteCommandArgs): Promise<void> {
  const stackName = getStackName(getDomainName(readStackConfig()));

  print.info(`Stack: ${stackName}`);

  if (args.yes) {
    print.warning(`The configured stack will be deleted automatically.`);
  } else {
    const confirmed = await print.confirmation(
      `Confirm to delete the configured stack.`,
    );

    if (!confirmed) {
      return;
    }
  }

  print.info(`Deleting stack...`);

  await deleteStack(stackName);

  print.success(`The configured stack has been successfully deleted.`);
}

deleteCommand.commandName = commandName;
deleteCommand.description = `Delete the configured stack.`;
deleteCommand.builder = builder;
