import type {Stack, Tag} from '@aws-sdk/client-cloudformation';
import type yargs from 'yargs';
import {readStackConfig} from './read-stack-config';
import {deleteStack} from './sdk/delete-stack';
import {findStacks} from './sdk/find-stacks';
import {getAgeInDays} from './utils/get-age-in-days';
import {getFormattedAgeInDays} from './utils/get-formatted-age-in-days';
import {print} from './utils/print';

export interface PurgeCommandArgs {
  readonly hostedZoneName: string | undefined;
  readonly legacyAppName: string | undefined;
  readonly minAge: number;
  readonly excludedTags: readonly string[];
  readonly yes: boolean;
}

const commandName = `purge`;

const builder: yargs.BuilderCallback<{}, {}> = (argv) =>
  argv
    .describe(
      `hosted-zone-name`,
      `An optional hosted zone name, if not specified it will be determined from the config file`,
    )
    .string(`hosted-zone-name`)

    .describe(
      `legacy-app-name`,
      `An optional app name to identify legacy stacks`,
    )
    .string(`legacy-app-name`)

    .describe(
      `min-age`,
      `The minimum age (in days) at which a deployed stack is considered expired`,
    )
    .number(`min-age`)
    .default(`min-age`, 14)

    .describe(
      `excluded-tags`,
      `Tags that prevent a deployed stack from being considered expired`,
    )
    .array(`excluded-tags`)
    .default(`excluded-tags`, [])

    .describe(`yes`, `Confirm the deletion of all expired stacks automatically`)
    .boolean(`yes`)
    .default(`yes`, false)

    .example(`npx $0 ${commandName}`, ``)
    .example(
      `npx $0 ${commandName} --min-age 14 --excluded-tags foo=true bar`,
      ``,
    )
    .example(`npx $0 ${commandName} --hosted-zone-name example.com`, ``)
    .example(`npx $0 ${commandName} --legacy-app-name example`, ``)
    .example(`npx $0 ${commandName} --yes`, ``);

export async function purgeCommand(args: PurgeCommandArgs): Promise<void> {
  const hostedZoneName =
    args.hostedZoneName || readStackConfig().hostedZoneName;

  const {legacyAppName, minAge: minAgeInDays, excludedTags} = args;

  print.warning(`Hosted zone: ${hostedZoneName}`);
  print.info(`Searching all expired stacks...`);

  const expiredStacks = (
    await findStacks({hostedZoneName, legacyAppName})
  ).filter((stack) => isExpired(stack, minAgeInDays, excludedTags));

  if (expiredStacks.length === 0) {
    print.success(`No expired stacks found.`);

    return;
  }

  for (const {StackName, StackStatus, CreationTime} of expiredStacks) {
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
    const confirmed = await print.confirmation(
      `Confirm to delete all expired stacks.`,
    );

    if (!confirmed) {
      return;
    }
  }

  print.info(`Deleting all expired stacks...`);

  const results = await Promise.allSettled(
    expiredStacks.map(async ({StackName}) => deleteStack(StackName!)),
  );

  const rejectedResults = results.filter(
    (result): result is PromiseRejectedResult => result.status === `rejected`,
  );

  if (rejectedResults.length > 0) {
    for (const {reason} of rejectedResults) {
      print.error(String(reason));
    }

    process.exit(1);
  } else {
    print.success(`All expired stacks have been successfully deleted.`);
  }
}

purgeCommand.commandName = commandName;
purgeCommand.description = `Delete all expired stacks filtered by the specified hosted zone name.`;
purgeCommand.builder = builder;

function isExpired(
  stack: Stack,
  minAgeInDays: number,
  excludedTags: readonly string[],
): boolean {
  const {
    StackStatus,
    CreationTime,
    DeletionTime,
    Tags,
    EnableTerminationProtection,
  } = stack;

  if (getAgeInDays(CreationTime!) < minAgeInDays) {
    return false;
  }

  if (
    DeletionTime &&
    StackStatus !== `ROLLBACK_COMPLETE` &&
    StackStatus !== `DELETE_FAILED`
  ) {
    return false;
  }

  if (Tags?.some((tag) => isTagExcluded(excludedTags, tag))) {
    return false;
  }

  return !EnableTerminationProtection;
}

function isTagExcluded(
  excludedTags: readonly string[],
  {Key, Value}: Tag,
): boolean {
  return excludedTags.some((excludedTag) =>
    excludedTag.includes(`=`)
      ? excludedTag === `${Key}=${Value}`
      : excludedTag === Key,
  );
}
