import type { ListRolesCommandOutput, Role } from '@aws-sdk/client-iam';

import { IAMClient, ListRolesCommand } from '@aws-sdk/client-iam';

export async function findRoles(): Promise<Role[]> {
  const roles: Role[] = [];
  const client = new IAMClient({});
  let output: ListRolesCommandOutput | undefined;

  do {
    output = await client.send(new ListRolesCommand({ Marker: output?.Marker }));

    if (output.Roles) {
      roles.push(...output.Roles);
    }
  } while (output.Marker);

  return roles;
}
