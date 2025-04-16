import type { Role } from '@aws-sdk/client-iam';
import type { CommandModule } from 'yargs';

import { deleteRole } from './sdk/delete-role.js';
import { findResourceIds } from './sdk/find-resource-ids.js';
import { findRoles } from './sdk/find-roles.js';
import { findStacks } from './sdk/find-stacks.js';
import { getTagsForRole } from './sdk/get-tags-for-role.js';
import { regionTagName } from './utils/constants.js';
import { print } from './utils/print.js';
import { APIGatewayClient, GetAccountCommand } from '@aws-sdk/client-api-gateway';

const commandName = `cleanup`;

const region = process.env[`AWS_REGION`] || process.env[`AWS_DEFAULT_REGION`];

export const cleanupCommand: CommandModule<{}, { readonly yes: boolean }> = {
  command: `${commandName} [options]`,
  describe: `Deletes unused resources created by aws-simple for same region using new default region tag. 
              If resource does not contain this tag, it will be deleted even if other regions are using it.`,

  builder: (argv) =>
    argv
      .options(`yes`, {
        describe: `Confirm the deletion of unused resources for region: ${region}`,
        boolean: true,
        default: false,
      })
      .example([[`npx $0 ${commandName}`], [`npx $0 ${commandName} --yes`]]),

  handler: async (args): Promise<void> => {
    print.info(`Searching unused resources for region ${region}...`);

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

    const roles = (await findRoles()).filter(
      (role) =>
        role.RoleName?.startsWith(`aws-simple-`) &&
        role.Arn?.includes(`RestApiCloudWatchRole`) &&
        role.Arn !== cloudwatchRoleArn &&
        !allResourceIds.has(role.RoleName),
    );

    for (const role of roles) {
      role.Tags = await getTagsForRole(role.RoleName);
    }

    const filterByRegion = (role: Role): boolean => {
      const regionTag = role.Tags?.find((tag) => tag.Key === regionTagName);

      return regionTag ? regionTag.Value === region : true;
    };

    const roleNames = roles.filter(filterByRegion).map((role) => role.RoleName!);

    if (roleNames.length === 0) {
      print.success(`No unused unused resources for region ${region} found.`);

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
      print.warning(`The found resources for region ${region} will be deleted automatically.`);
    } else {
      const confirmed = await print.confirmation(
        `Confirm to delete the found resources for region ${region}.`,
      );

      if (!confirmed) {
        return;
      }
    }

    print.info(`Deleting the found resources for region ${region}...`);

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
      print.success(`The found resources for region ${region} have been successfully deleted.`);
    }
  },
};
