import type yargs from 'yargs';
import {readStackConfig} from './read-stack-config';
import {findStack} from './sdk/find-stack';
import {getOutputValue} from './sdk/get-output-value';
import {uploadFile} from './sdk/upload-file';
import {getDomainName} from './utils/get-domain-name';
import {getFilePaths} from './utils/get-file-paths';
import {getStackName} from './utils/get-stack-name';
import {print} from './utils/print';

export interface UploadCommandArgs {
  readonly yes: boolean;
}

const commandName = `upload`;

const builder: yargs.BuilderCallback<{}, {}> = (argv) =>
  argv
    .describe(`yes`, `Confirm the upload automatically`)
    .boolean(`yes`)
    .default(`yes`, false)

    .example(`npx $0 ${commandName}`, ``)
    .example(`npx $0 ${commandName} --yes`, ``);

export async function uploadCommand(args: UploadCommandArgs): Promise<void> {
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

  print.info(`Stack: ${stackName}`);

  const bucketName = getOutputValue(await findStack(stackName), `BucketName`);

  if (!bucketName) {
    throw new Error(
      `The S3 bucket name of the configured stack cannot be found.`,
    );
  }

  if (filePaths.size === 0) {
    print.warning(`No files found to upload.`);
    return;
  }

  print.listItem(0, {type: `headline`, text: `Files`});

  for (const filePath of filePaths) {
    print.listItem(1, filePath);
  }

  if (args.yes) {
    print.warning(
      `The listed files will be uploaded automatically to the S3 bucket of the configured stack.`,
    );
  } else {
    const confirmed = await print.confirmation(
      `Confirm to upload the listed files to the S3 bucket of the configured stack.`,
    );

    if (!confirmed) {
      return;
    }
  }

  print.info(`Uploading files...`);

  const results = await Promise.allSettled(
    [...filePaths].map(async (filePath) => uploadFile(bucketName, filePath)),
  );

  const rejectedResults = results.filter(
    (result): result is PromiseRejectedResult => result.status === `rejected`,
  );

  if (rejectedResults.length > 0) {
    print.error(...rejectedResults.map(({reason}) => String(reason)));
    process.exit(1);
  } else {
    print.success(`All listed files have been successfully uploaded.`);
  }
}

uploadCommand.commandName = commandName;
uploadCommand.description = `Upload the associated files to the S3 bucket of the configured stack.`;
uploadCommand.builder = builder;
