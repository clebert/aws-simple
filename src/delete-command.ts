import type { CommandModule } from 'yargs';

import { parseDomainNameParts } from './parse-domain-name-parts.js';
import { readStackConfig } from './read-stack-config.js';
import { deleteStack } from './sdk/delete-stack.js';
import { getDomainName } from './utils/get-domain-name.js';
import { getStackName } from './utils/get-stack-name.js';
import { print } from './utils/print.js';

const commandName = `delete`;

export const deleteCommand: CommandModule<
  {},
  { readonly 'stack-name': string | undefined; readonly 'yes': boolean }
> = {
  command: `${commandName} [options]`,
  describe: `Delete the specified stack.`,

  builder: (argv) =>
    argv
      .options(`stack-name`, {
        describe: `An optional stack name, if not specified it will be determined from the config file`,
        string: true,
      })
      .options(`yes`, {
        describe: `Confirm the deletion of the specified stack automatically`,
        boolean: true,
        default: false,
      })
      .example([
        [`npx $0 ${commandName}`],
        [`npx $0 ${commandName} --stack-name ${getStackName(`example.com`)}`],
        [`npx $0 ${commandName} --yes`],
      ]),

  handler: async (args): Promise<void> => {
    const stackName =
      args.stackName || getStackName(getDomainName(parseDomainNameParts(await readStackConfig())));

    print.warning(`Stack: ${stackName}`);

    if (args.yes) {
      print.warning(`The specified stack will be deleted automatically.`);
    } else {
      const confirmed = await print.confirmation(`Confirm to delete the specified stack.`);

      if (!confirmed) {
        return;
      }
    }

    print.info(`Deleting the specified stack...`);

    await deleteStack(stackName);

    print.success(`The specified stack has been successfully deleted.`);
  },
};
