import * as CLI from './cli';
import type {StackConfig} from './get-stack-config';
import {findStack} from './sdk/find-stack';
import {getOutputValue} from './sdk/get-output-value';
import {uploadFile} from './sdk/upload-file';
import {getFilePaths} from './utils/get-file-paths';

export interface UploadArgs {
  readonly yes: boolean;
}

export async function upload(
  stackConfig: StackConfig,
  args: UploadArgs,
): Promise<void> {
  const filePaths = new Set<string>();

  for (const route of stackConfig.routes) {
    if (route.type === `file`) {
      filePaths.add(route.path);
    } else if (route.type === `folder`) {
      for (const filePath of await getFilePaths(route.path)) {
        filePaths.add(filePath);
      }
    }
  }

  const stack = await findStack(stackConfig);
  const bucketName = getOutputValue(stack, `BucketName`);

  if (!bucketName) {
    throw new Error(`The bucket name cannot be found.`);
  }

  if (filePaths.size === 0) {
    CLI.warning(`No files found to upload.`);
    return;
  }

  CLI.listItem(0, CLI.headline(`Files`));

  for (const filePath of filePaths) {
    CLI.listItem(1, filePath);
  }

  if (args.yes) {
    CLI.warning(`The upload was started automatically...`);
  } else {
    const confirmed = await CLI.confirmation(
      `Start uploading the listed files?`,
    );

    if (!confirmed) {
      return;
    }
  }

  await Promise.all(
    [...filePaths].map(async (filePath) => uploadFile(bucketName, filePath)),
  );

  CLI.success(`All files have been uploaded successfully.`);
}
