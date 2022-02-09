import type yargs from 'yargs';
import {printConfirmation, printInfo, printSuccess, printWarning} from './cli';
import {readStackConfig} from './read-stack-config';
import {deleteStack} from './sdk/delete-stack';
import {getDomainName} from './utils/get-domain-name';
import {getStackName} from './utils/get-stack-name';

export interface DeleteStackArgs {
  readonly yes: boolean;
  readonly hostedZoneName: string | undefined;
  readonly aliasRecordName: string | undefined;
}

const command: yargs.BuilderCallback<{}, {}> = (argv) =>
  argv
    .describe(`yes`, `Confirm the deletion`)
    .boolean(`yes`)
    .default(`yes`, false)

    .describe(
      `hosted-zone-name`,
      `If not specified, the name is read from the config file`,
    )
    .string(`hosted-zone-name`)

    .describe(
      `alias-record-name`,
      `If not specified, the name is read from the config file`,
    )
    .string(`alias-record-name`)

    .example(`npx $0 delete`, ``)
    .example(`npx $0 delete --yes`, ``)
    .example(`npx $0 delete --hosted-zone-name=example.com`, ``)
    .example(`npx $0 delete --alias-record-name=test`, ``);

export async function delete_(args: DeleteStackArgs): Promise<void> {
  const stackConfig = readStackConfig();

  const stackName = getStackName(
    getDomainName({
      hostedZoneName: args.hostedZoneName || stackConfig.hostedZoneName,
      aliasRecordName: args.aliasRecordName || stackConfig.aliasRecordName,
    }),
  );

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
