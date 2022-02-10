import type yargs from 'yargs';
import {printConfirmation, printInfo, printSuccess, printWarning} from './cli';
import {readStackConfig} from './read-stack-config';
import {updateStack} from './sdk/update-stack';
import {getDomainName} from './utils/get-domain-name';
import {getStackName} from './utils/get-stack-name';

export interface TagCommandArgs {
  readonly add: readonly string[];
  readonly remove: readonly string[];
  readonly yes: boolean;
}

const commandName = `tag`;

const builder: yargs.BuilderCallback<{}, {}> = (argv) =>
  argv
    .describe(`add`, `The tags to add to the configured stack`)
    .array(`add`)
    .default(`add`, [])

    .describe(`remove`, `The tags to remove from the configured stack`)
    .array(`remove`)
    .default(`remove`, [])

    .describe(`yes`, `Confirm the update automatically`)
    .boolean(`yes`)
    .default(`yes`, false)

    .example(`npx $0 ${commandName} --add foo bar --remove baz`, ``)
    .example(
      `npx $0 ${commandName} --add foo=something bar="something else"`,
      ``,
    )
    .example(`npx $0 ${commandName} --add foo --yes`, ``);

export async function tagCommand(args: TagCommandArgs): Promise<void> {
  const stackName = getStackName(getDomainName(readStackConfig()));

  printInfo(`Stack: ${stackName}`);

  if (args.yes) {
    printWarning(
      `The specified tags of the configured stack will be updated automatically.`,
    );
  } else {
    const confirmed = await printConfirmation(
      `Confirm to update the specified tags of the configured stack.`,
    );

    if (!confirmed) {
      return;
    }
  }

  printInfo(`Updating stack...`);

  await updateStack(stackName, {
    tagsToAdd: args.add.map((tag) => ({
      key: tag.split(`=`)[0]!.trim(),
      value: tag.split(`=`)[1]?.trim() || `true`,
    })),
    tagKeysToRemove: args.remove.map((tag) => tag.trim()).filter(Boolean),
  });

  printSuccess(`All specified tags have been successfully updated.`);
}

tagCommand.commandName = commandName;
tagCommand.description = `Update the specified tags of the configured stack.`;
tagCommand.builder = builder;
