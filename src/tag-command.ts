import type {CommandModule} from 'yargs';

import {parseDomainNameParts} from './parse-domain-name-parts.js';
import {readStackConfig} from './read-stack-config.js';
import {updateTags} from './sdk/update-tags.js';
import {getDomainName} from './utils/get-domain-name.js';
import {getStackName} from './utils/get-stack-name.js';
import {print} from './utils/print.js';

const commandName = `tag`;

export const tagCommand: CommandModule<
  {},
  {
    readonly 'stack-name': string | undefined;
    readonly 'add': readonly (string | number)[];
    readonly 'remove': readonly (string | number)[];
    readonly 'yes': boolean;
  }
> = {
  command: `${commandName} [options]`,
  describe: `Update the tags of the specified stack.`,

  builder: (argv) =>
    argv
      .options(`stack-name`, {
        describe: `An optional stack name, if not specified it will be determined from the config file`,
        string: true,
      })
      .options(`add`, {
        describe: `Tags to add to the specified stack`,
        array: true,
        default: [],
      })
      .options(`remove`, {
        describe: `Tags to remove from the specified stack`,
        array: true,
        default: [],
      })
      .options(`yes`, {
        describe: `Confirm to add or remove the specified tags automatically`,
        boolean: true,
        default: false,
      })
      .example([
        [
          `npx $0 ${commandName} --stack-name ${getStackName(
            `example.com`,
          )} --add latest release --remove prerelease`,
        ],
        [`npx $0 ${commandName} --add foo=something bar="something else"`],
        [`npx $0 ${commandName} --add prerelease --yes`],
      ]),

  handler: async (args): Promise<void> => {
    const stackName =
      args.stackName || getStackName(getDomainName(parseDomainNameParts(await readStackConfig())));

    print.warning(`Stack: ${stackName}`);

    if (args.yes) {
      print.warning(`The tags of the specified stack will be updated.`);
    } else {
      const confirmed = await print.confirmation(
        `Confirm to update the tags of the specified stack.`,
      );

      if (!confirmed) {
        return;
      }
    }

    print.info(`Updating tags...`);

    await updateTags({
      stackName,
      tagsToAdd: args.add.map((arg) => parseTag(arg.toString())),
      tagKeysToRemove: args.remove.map((arg) => arg.toString()),
    });

    print.success(`The tags of the specified stack have been successfully updated.`);
  },
};

function parseTag(arg: string): [string, string | undefined] {
  const [key, value] = arg.split(`=`) as [string, ...string[]];

  return [key, value];
}
