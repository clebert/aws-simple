import type {CommandModule} from 'yargs';
import {readStackConfig} from './read-stack-config.js';
import {findStacks} from './sdk/find-stacks.js';
import {getFormattedAgeInDays} from './utils/get-formatted-age-in-days.js';
import {print} from './utils/print.js';

const commandName = `list`;

export const listCommand: CommandModule<
  {},
  {
    readonly 'hosted-zone-name': string | undefined;
    readonly 'legacy-app-name': string | undefined;
    readonly 'all': boolean;
    readonly 'short': boolean;
    readonly 'json': boolean;
  }
> = {
  command: `${commandName} [options]`,
  describe: `List all deployed stacks filtered by the specified hosted zone name.`,

  builder: (argv) =>
    argv
      .options(`hosted-zone-name`, {
        describe: `An optional hosted zone name, if not specified it will be determined from the config file`,
        string: true,
      })
      .options(`legacy-app-name`, {
        describe: `An optional app name to identify legacy stacks`,
        string: true,
      })
      .options(`all`, {
        describe: `List all deployed stacks without filtering by hosted zone name`,
        boolean: true,
        default: false,
      })
      .options(`short`, {
        describe: `Give the output in an easy-to-parse format for scripts`,
        boolean: true,
        default: false,
      })
      .options(`json`, {
        describe: `Give the output in JSON format for scripts`,
        boolean: true,
        default: false,
      })
      .example([
        [`npx $0 ${commandName}`],
        [`npx $0 ${commandName} --hosted-zone-name example.com`],
        [`npx $0 ${commandName} --legacy-app-name example`],
        [`npx $0 ${commandName} --all`],
        [`npx $0 ${commandName} --short`],
        [`npx $0 ${commandName} --json`],
      ]),

  handler: async (args): Promise<void> => {
    const {legacyAppName, all, short, json} = args;

    const hostedZoneName = all
      ? undefined
      : args.hostedZoneName || (await readStackConfig()).hostedZoneName;

    if (!hostedZoneName && !all) {
      throw new Error(
        `Please specify either a hosted zone name or the --all option.`,
      );
    }

    if (!short && !json) {
      if (hostedZoneName) {
        print.warning(`Hosted zone: ${hostedZoneName}`);
      }

      print.info(`Searching all deployed stacks...`);
    }

    const stacks = hostedZoneName
      ? await findStacks({hostedZoneName, legacyAppName})
      : await findStacks();

    if (stacks.length === 0) {
      if (!short && !json) {
        print.warning(`No deployed stacks found.`);
      }

      return;
    }

    if (short) {
      for (const {StackName} of stacks) {
        print(StackName!);
      }

      return;
    }

    if (json) {
      const jsonOutput = stacks.map((stack) => ({
        stackName: stack.StackName,
        status: stack.StackStatus,
        created: stack.CreationTime?.getTime(),
        updated: stack.LastUpdatedTime?.getTime(),
        terminationProtection: stack.EnableTerminationProtection,
        tags:
          stack.Tags?.map(({Key, Value}) => ({key: Key, value: Value})) ?? [],
      }));

      print(JSON.stringify(jsonOutput));

      return;
    }

    for (const stack of stacks) {
      print.listItem(0, {
        type: `headline`,
        text: stack.StackName!,
      });

      print.listItem(1, {
        type: `entry`,
        key: `Status`,
        value: stack.StackStatus!,
      });

      print.listItem(1, {
        type: `entry`,
        key: `Created`,
        value: getFormattedAgeInDays(stack.CreationTime!),
      });

      print.listItem(1, {
        type: `entry`,
        key: `Updated`,
        value: getFormattedAgeInDays(stack.LastUpdatedTime!),
      });

      print.listItem(1, {
        type: `entry`,
        key: `Termination protection`,
        value: stack.EnableTerminationProtection ? `Enabled` : `Disabled`,
      });

      if (stack.Tags && stack.Tags?.length > 0) {
        print.listItem(1, {type: `headline`, text: `Tags`});

        for (const {Key, Value} of stack.Tags) {
          print.listItem(2, {type: `entry`, key: Key!, value: Value!});
        }
      }
    }
  },
};
