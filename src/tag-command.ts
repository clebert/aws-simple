import type yargs from 'yargs';
import {readStackConfig} from './read-stack-config';
import {updateStack} from './sdk/update-stack';
import {getDomainName} from './utils/get-domain-name';
import {getStackName} from './utils/get-stack-name';
import {print} from './utils/print';

export interface TagCommandArgs {
  readonly stackName: string | undefined;
  readonly add: readonly string[];
  readonly remove: readonly string[];
  readonly yes: boolean;
}

const commandName = `tag`;

const builder: yargs.BuilderCallback<{}, {}> = (argv) =>
  argv
    .describe(
      `stack-name`,
      `An optional stack name, if not specified it will be determined from the config file`,
    )
    .string(`stack-name`)

    .describe(`add`, `The tags to add to the specified stack`)
    .array(`add`)
    .default(`add`, [])

    .describe(`remove`, `The tags to remove from the specified stack`)
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
    .example(
      `npx $0 ${commandName} --add foo --stack-name aws-simple-example-com-1234567`,
      ``,
    )
    .example(`npx $0 ${commandName} --add foo --yes`, ``);

export async function tagCommand(args: TagCommandArgs): Promise<void> {
  const stackName =
    args.stackName || getStackName(getDomainName(readStackConfig()));

  print.warning(`Stack: ${stackName}`);

  if (args.yes) {
    print.warning(`The specified stack will be updated automatically.`);
  } else {
    const confirmed = await print.confirmation(
      `Confirm to update the specified stack.`,
    );

    if (!confirmed) {
      return;
    }
  }

  print.info(`Updating stack...`);

  await updateStack(stackName, {
    tagsToAdd: args.add.map((tag) => ({
      key: tag.split(`=`)[0]!.trim(),
      value: tag.split(`=`)[1]?.trim() || `true`,
    })),
    tagKeysToRemove: args.remove.map((tag) => tag.trim()).filter(Boolean),
  });

  print.success(`The specified stack has been successfully updated.`);
}

tagCommand.commandName = commandName;
tagCommand.description = `Update the tags of the specified stack.`;
tagCommand.builder = builder;
