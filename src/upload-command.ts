import type {CommandModule} from 'yargs';

import {parseStackConfig} from './parse-stack-config.js';
import {readStackConfig} from './read-stack-config.js';
import {findStack} from './sdk/find-stack.js';
import {getOutputValue} from './sdk/get-output-value.js';
import {uploadFile} from './sdk/upload-file.js';
import {getDomainName} from './utils/get-domain-name.js';
import {getFilePaths} from './utils/get-file-paths.js';
import {getStackName} from './utils/get-stack-name.js';
import {print} from './utils/print.js';

const commandName = `upload`;

export const uploadCommand: CommandModule<{}, {readonly yes: boolean}> = {
  command: `${commandName} [options]`,
  describe: `Upload all referenced files to the S3 bucket of the configured stack.`,

  builder: (argv) =>
    argv
      .options(`yes`, {
        describe: `Confirm the upload of all referenced files automatically`,
        boolean: true,
        default: false,
      })
      .example([[`npx $0 ${commandName}`], [`npx $0 ${commandName} --yes`]]),

  handler: async (args): Promise<void> => {
    const stackConfig = parseStackConfig(await readStackConfig());
    const domainName = getDomainName(stackConfig);
    const stackName = getStackName(domainName);

    print.warning(`Stack: ${stackName}`);

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

    if (filePaths.size === 0) {
      print.warning(`No files found to upload.`);
      return;
    }

    print.listItem(0, {type: `headline`, text: `Referenced files`});

    for (const filePath of filePaths) {
      print.listItem(1, filePath);
    }

    if (args.yes) {
      print.warning(
        `All referenced files will be uploaded automatically to the S3 bucket of the configured stack.`,
      );
    } else {
      const confirmed = await print.confirmation(
        `Confirm to upload all referenced files to the S3 bucket of the configured stack.`,
      );

      if (!confirmed) {
        return;
      }
    }

    print.info(`Uploading all referenced files...`);

    const bucketName = getOutputValue(await findStack(stackName), `BucketName`);

    if (!bucketName) {
      throw new Error(`The S3 bucket cannot be found.`);
    }

    const results = await Promise.allSettled(
      [...filePaths].map(async (filePath) => uploadFile(bucketName, filePath)),
    );

    const rejectedResults = results.filter(
      (result): result is PromiseRejectedResult => result.status === `rejected`,
    );

    if (rejectedResults.length > 0) {
      for (const {reason} of rejectedResults) {
        print.error(String(reason));
      }

      process.exit(1);
    } else {
      print.success(
        `All referenced files have been successfully uploaded and are available at the following URL: https://${domainName}`,
      );
    }
  },
};
