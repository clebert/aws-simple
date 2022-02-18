import type {CommandModule} from 'yargs';
import {readStackConfig} from './read-stack-config';
import {findStacks} from './sdk/find-stacks';
import {getFormattedAgeInDays} from './utils/get-formatted-age-in-days';
import {print} from './utils/print';

const commandName = `list`;

export const listCommand: CommandModule<
  {},
  {
    readonly 'hosted-zone-name': string | undefined;
    readonly 'legacy-app-name': string | undefined;
    readonly 'all': boolean;
    readonly 'short': boolean;
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
      .example([
        [`npx $0 ${commandName}`],
        [`npx $0 ${commandName} --hosted-zone-name example.com`],
        [`npx $0 ${commandName} --legacy-app-name example`],
        [`npx $0 ${commandName} --all`],
        [`npx $0 ${commandName} --short`],
      ]),

  handler: async (args): Promise<void> => {
    const hostedZoneName =
      args.hostedZoneName || readStackConfig().hostedZoneName;

    const {legacyAppName, all, short} = args;

    if (!short) {
      if (!all) {
        print.warning(`Hosted zone: ${hostedZoneName}`);
      }

      print.info(`Searching all deployed stacks...`);
    }

    const stacks = all
      ? await findStacks()
      : await findStacks({hostedZoneName, legacyAppName});

    if (stacks.length === 0) {
      if (!short) {
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
