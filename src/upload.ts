import chalk from 'chalk';
import type {StackConfig} from './get-stack-config';
import {findStack} from './sdk/find-stack';
import {getOutputValue} from './sdk/get-output-value';
import {uploadFile} from './sdk/upload-file';
import {getFilePaths} from './utils/get-file-paths';

export async function upload(stackConfig: StackConfig): Promise<void> {
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

  await Promise.all(
    [...filePaths].map(async (filePath) => {
      console.log(`• Uploading file: ${filePath}`);
      return uploadFile(bucketName, filePath);
    }),
  );

  console.log(
    `\n${chalk.green(`✔`)} All files have been uploaded successfully.`,
  );
}
