import type {ListAttachedRolePoliciesCommandOutput} from '@aws-sdk/client-iam';

import {
  DeleteRoleCommand,
  DetachRolePolicyCommand,
  IAMClient,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';

export async function deleteRole(roleName: string): Promise<void> {
  const client = new IAMClient({});
  const policyArns: string[] = [];

  let output: ListAttachedRolePoliciesCommandOutput | undefined;

  do {
    output = await client.send(
      new ListAttachedRolePoliciesCommand({
        RoleName: roleName,
        Marker: output?.Marker,
      }),
    );

    if (output.AttachedPolicies) {
      for (const {PolicyArn} of output.AttachedPolicies) {
        if (PolicyArn) {
          policyArns.push(PolicyArn);
        }
      }
    }
  } while (output.Marker);

  for (const policyArn of policyArns) {
    await client.send(
      new DetachRolePolicyCommand({RoleName: roleName, PolicyArn: policyArn}),
    );
  }

  await client.send(new DeleteRoleCommand({RoleName: roleName}));
}
