import chalk from 'chalk';
import prompts from 'prompts';
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
    console.log(chalk.yellow(`No files found to upload.`));
    return;
  }

  console.log(`${chalk.bold(chalk.underline(`Files`))}:`);

  for (const filePath of filePaths) {
    console.log(`  • ${filePath}`);
  }

  console.log(``);

  if (args.yes) {
    console.log(chalk.yellow(`The upload was started automatically...`));
  } else {
    const {uploadConfirmation} = await prompts({
      type: `confirm`,
      name: `uploadConfirmation`,
      message: `Start uploading the listed files?`,
    });

    if (!uploadConfirmation) {
      return;
    }
  }

  await Promise.all(
    [...filePaths].map(async (filePath) => uploadFile(bucketName, filePath)),
  );

  console.log(`\n${chalk.green(`All files have been uploaded successfully.`)}`);
}
