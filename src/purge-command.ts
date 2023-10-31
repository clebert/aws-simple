import type { Stack, Tag } from '@aws-sdk/client-cloudformation';
import type { CommandModule } from 'yargs';

import { parseDomainNameParts } from './parse-domain-name-parts.js';
import { readStackConfig } from './read-stack-config.js';
import { deleteStack } from './sdk/delete-stack.js';
import { findStacks } from './sdk/find-stacks.js';
import { getAgeInDays } from './utils/get-age-in-days.js';
import { getFormattedAgeInDays } from './utils/get-formatted-age-in-days.js';
import { print } from './utils/print.js';

const commandName = `purge`;

export const purgeCommand: CommandModule<
  {},
  {
    readonly 'hosted-zone-name': string | undefined;
    readonly 'min-age': number;
    readonly 'excluded-tags': readonly (string | number)[];
    readonly 'yes': boolean;
  }
> = {
  command: `${commandName} [options]`,
  describe: `Delete all expired stacks filtered by the specified hosted zone name.`,

  builder: (argv) =>
    argv
      .options(`hosted-zone-name`, {
        describe: `An optional hosted zone name, if not specified it will be determined from the config file`,
        string: true,
      })
      .options(`min-age`, {
        describe: `The minimum age (in days) at which a deployed stack is considered expired`,
        number: true,
        default: 14,
      })
      .options(`excluded-tags`, {
        describe: `Tags that prevent a deployed stack from being considered expired`,
        array: true,
        default: [],
      })
      .options(`yes`, {
        describe: `Confirm the deletion of all expired stacks automatically`,
        boolean: true,
        default: false,
      })
      .example([
        [`npx $0 ${commandName}`],
        [`npx $0 ${commandName} --hosted-zone-name example.com`],
        [`npx $0 ${commandName} --min-age 14`],
        [`npx $0 ${commandName} --excluded-tags foo=true bar`],
        [`npx $0 ${commandName} --yes`],
      ]),

  handler: async (args): Promise<void> => {
    const hostedZoneName =
      args.hostedZoneName || parseDomainNameParts(await readStackConfig()).hostedZoneName;

    if (!hostedZoneName) {
      throw new Error(`Please specify a hosted zone name.`);
    }

    const { minAge: minAgeInDays, excludedTags } = args;

    print.warning(`Hosted zone: ${hostedZoneName}`);
    print.info(`Searching all expired stacks...`);

    const expiredStacks = (await findStacks(hostedZoneName)).filter((stack) =>
      isExpired(stack, minAgeInDays, excludedTags.map(String)),
    );

    if (expiredStacks.length === 0) {
      print.success(`No expired stacks found.`);

      return;
    }

    for (const { StackName, StackStatus, CreationTime } of expiredStacks) {
      print.listItem(0, {
        type: `entry`,
        key: `Expired stack`,
        value: StackName!,
      });

      print.listItem(1, {
        type: `entry`,
        key: `Status`,
        value: StackStatus!,
      });

      print.listItem(1, {
        type: `entry`,
        key: `Created`,
        value: getFormattedAgeInDays(CreationTime!),
      });
    }

    if (args.yes) {
      print.warning(`All expired stacks will be deleted automatically.`);
    } else {
      const confirmed = await print.confirmation(`Confirm to delete all expired stacks.`);

      if (!confirmed) {
        return;
      }
    }

    print.info(`Deleting all expired stacks...`);

    let aStackFailedToBeDeleted = false;

    for (const { StackName } of expiredStacks) {
      print.info(`Deleting expired stack ${StackName}...`);

      try {
        await deleteStack(StackName!);
        print.info(`Successfully deleted expired stack ${StackName}.`);
      } catch (error) {
        aStackFailedToBeDeleted = true;

        print.error(`Failed to delete expired stack ${StackName}. ${String(error)}`);
      }
    }

    if (aStackFailedToBeDeleted) {
      process.exit(1);
    } else {
      print.success(`All expired stacks have been successfully deleted.`);
    }
  },
};

function isExpired(stack: Stack, minAgeInDays: number, excludedTags: readonly string[]): boolean {
  const { StackStatus, CreationTime, DeletionTime, Tags, EnableTerminationProtection } = stack;

  if (getAgeInDays(CreationTime!) < minAgeInDays) {
    return false;
  }

  if (DeletionTime && StackStatus !== `ROLLBACK_COMPLETE` && StackStatus !== `DELETE_FAILED`) {
    return false;
  }

  if (Tags?.some((tag) => isTagExcluded(excludedTags, tag))) {
    return false;
  }

  return !EnableTerminationProtection;
}

function isTagExcluded(excludedTags: readonly string[], { Key, Value }: Tag): boolean {
  return excludedTags.some((excludedTag) =>
    excludedTag.includes(`=`) ? excludedTag === `${Key}=${Value}` : excludedTag === Key,
  );
}
