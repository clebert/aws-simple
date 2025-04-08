import type { Role } from '@aws-sdk/client-iam';
import type { CommandModule } from 'yargs';

import { deleteRole } from './sdk/delete-role.js';
import { findResourceIds } from './sdk/find-resource-ids.js';
import { findRoles } from './sdk/find-roles.js';
import { findStacks } from './sdk/find-stacks.js';
import { regionTagName } from './utils/constants.js';
import { print } from './utils/print.js';
import { APIGatewayClient, GetAccountCommand } from '@aws-sdk/client-api-gateway';

const commandName = `cleanup`;

const { CDK_DEFAULT_REGION: region } = process.env;

export const cleanupCommand: CommandModule<{}, { readonly yes: boolean }> = {
  command: `${commandName} [options]`,
  describe: `Deletes unused account-wide resources created by aws-simple.`,

  builder: (argv) =>
    argv
      .options(`yes`, {
        describe: `Confirm the deletion of unused account-wide resources`,
        boolean: true,
        default: false,
      })
      .example([[`npx $0 ${commandName}`], [`npx $0 ${commandName} --yes`]]),

  handler: async (args): Promise<void> => {
    print.info(`Searching unused account-wide resources...`);

    const stacks = await findStacks();
    const allResourceIds = new Set<string>();

    for (const stack of stacks) {
      if (stack.StackName) {
        const resourceIds = await findResourceIds(stack.StackName);

        for (const resourceId of resourceIds) {
          allResourceIds.add(resourceId);
        }
      }
    }

    const client = new APIGatewayClient({});
    const { cloudwatchRoleArn } = await client.send(new GetAccountCommand({}));

    const filterByRegion = (role: Role): boolean => {
      const regionTag = role.Tags?.find((tag) => tag.Key === regionTagName);
      if (regionTag) {
        return regionTag.Value === region;
      }
      return true;
    };

    const roleNames = (await findRoles())
      .filter(
        (role) =>
          role.RoleName?.startsWith(`aws-simple-`) &&
          role.Arn?.includes(`RestApiCloudWatchRole`) &&
          role.Arn !== cloudwatchRoleArn &&
          !allResourceIds.has(role.RoleName),
      )
      .filter(filterByRegion)
      .map((role) => role.RoleName!);

    if (roleNames.length === 0) {
      print.success(`No unused account-wide resources found.`);

      return;
    }

    for (const roleName of roleNames) {
      print.listItem(0, {
        type: `entry`,
        key: `REST-API CloudWatch role`,
        value: roleName,
      });
    }

    if (args.yes) {
      print.warning(`The found account-wide resources will be deleted automatically.`);
    } else {
      const confirmed = await print.confirmation(
        `Confirm to delete the found account-wide resources.`,
      );

      if (!confirmed) {
        return;
      }
    }

    print.info(`Deleting the found account-wide resources...`);

    const results = await Promise.allSettled(
      roleNames.map(async (roleName) => deleteRole(roleName)),
    );

    const rejectedResults = results.filter(
      (result): result is PromiseRejectedResult => result.status === `rejected`,
    );

    if (rejectedResults.length > 0) {
      for (const { reason } of rejectedResults) {
        print.error(String(reason));
      }

      process.exit(1);
    } else {
      print.success(`The found account-wide resources have been successfully deleted.`);
    }
  },
};
