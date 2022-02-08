import chalk from 'chalk';
import type {Cli} from './cli';
import type {StackConfig} from './get-stack-config';
import {findStack} from './sdk/find-stack';
import {getOutputValue} from './sdk/get-output-value';
import {uploadFile} from './sdk/upload-file';
import {getFilePaths} from './utils/get-file-paths';

export interface UploadArgs {
  readonly yes: boolean;
}

export async function upload(
  cli: Cli,
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
    cli.paragraph(`No files found to upload.`, {messageType: `warning`});
    return;
  }

  cli.paragraph(`${chalk.bold(chalk.underline(`Files`))}:`);

  for (const filePath of filePaths) {
    cli.bullet(filePath, {indentationLevel: 1});
  }

  if (args.yes) {
    cli.paragraph(`The upload was started automatically...`, {
      messageType: `warning`,
    });
  } else {
    const confirmed = await cli.confirmation(
      `Start uploading the listed files?`,
    );

    if (!confirmed) {
      return;
    }
  }

  await Promise.all(
    [...filePaths].map(async (filePath) => uploadFile(bucketName, filePath)),
  );

  cli.paragraph(`All files have been uploaded successfully.`, {
    messageType: `success`,
  });
}
