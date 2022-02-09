import type yargs from 'yargs';
import {
  formatHeadline,
  printConfirmation,
  printError,
  printInfo,
  printList,
  printSuccess,
  printWarning,
} from './cli';
import {readStackConfig} from './read-stack-config';
import {findStack} from './sdk/find-stack';
import {getOutputValue} from './sdk/get-output-value';
import {uploadFile} from './sdk/upload-file';
import {getDomainName} from './utils/get-domain-name';
import {getFilePaths} from './utils/get-file-paths';
import {getStackName} from './utils/get-stack-name';

export interface UploadArgs {
  readonly yes: boolean;
}

const command: yargs.BuilderCallback<{}, {}> = (argv) =>
  argv
    .describe(`yes`, `Confirm the upload`)
    .boolean(`yes`)
    .default(`yes`, false)

    .example(`npx $0 upload`, ``)
    .example(`npx $0 upload --yes`, ``);

export async function upload(args: UploadArgs): Promise<void> {
  const stackConfig = readStackConfig();
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

  const stackName = getStackName(getDomainName(stackConfig));
  const bucketName = getOutputValue(await findStack(stackName), `BucketName`);

  if (!bucketName) {
    throw new Error(`The bucket of the stack cannot be found: ${stackName}`);
  }

  if (filePaths.size === 0) {
    printWarning(`No files found to upload.`);
    return;
  }

  printList(0, formatHeadline(`Files`));

  for (const filePath of filePaths) {
    printList(1, filePath);
  }

  if (args.yes) {
    printWarning(
      `The listed files will be uploaded to the bucket of the stack: ${stackName}`,
    );
  } else {
    const confirmed = await printConfirmation(
      `Confirm to upload the listed files to the bucket of the stack: ${stackName}`,
    );

    if (!confirmed) {
      return;
    }
  }

  printInfo(`The upload process is running...`);

  const results = await Promise.allSettled(
    [...filePaths].map(async (filePath) => uploadFile(bucketName, filePath)),
  );

  const rejectedResults = results.filter(
    (result): result is PromiseRejectedResult => result.status === `rejected`,
  );

  if (rejectedResults.length > 0) {
    printError(...rejectedResults.map(({reason}) => String(reason)));
    process.exit(1);
  } else {
    printSuccess(`All files have been uploaded successfully.`);
  }
}

upload.command = command;
