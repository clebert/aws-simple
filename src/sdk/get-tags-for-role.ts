import type { ListRoleTagsCommandOutput, Tag } from '@aws-sdk/client-iam';

import { IAMClient, ListRoleTagsCommand } from '@aws-sdk/client-iam';

export async function getTagsForRole(RoleName?: string): Promise<Tag[]> {
  const tags: Tag[] = [];
  const client = new IAMClient({});
  let output: ListRoleTagsCommandOutput | undefined;

  do {
    output = await client.send(new ListRoleTagsCommand({ RoleName, Marker: output?.Marker }));

    if (output.Tags) {
      tags.push(...output.Tags);
    }
  } while (output.Marker);

  return tags;
}
