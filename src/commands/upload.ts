import {CloudFormation} from 'aws-sdk';
import Listr from 'listr';
import path from 'path';
import joinUrl from 'url-join';
import {Argv} from 'yargs';
import {createStackBaseUrl} from '../sdk/create-stack-base-url';
import {findStack} from '../sdk/find-stack';
import {uploadFilesToS3} from '../sdk/upload-files-to-s3';
import {AppConfig} from '../types';

interface UploadArgv {
  readonly _: ['upload'];
}

function isUploadArgv(argv: {readonly _: string[]}): argv is UploadArgv {
  return argv._[0] === 'upload';
}

export async function upload(
  appConfig: AppConfig,
  clientConfig: CloudFormation.ClientConfiguration,
  argv: {readonly _: string[]}
): Promise<void> {
  if (!isUploadArgv(argv)) {
    return;
  }

  const stack = await findStack(appConfig, clientConfig);
  const stackConfig = appConfig.createStackConfig();
  const baseUrl = createStackBaseUrl(stackConfig, stack);
  const listrTasks: Listr.ListrTask[] = [];
  const {s3Configs = []} = stackConfig;

  for (const s3Config of s3Configs) {
    const {type, publicPath} = s3Config;

    for (const s3UploadTask of uploadFilesToS3(clientConfig, stack, s3Config)) {
      const {filename, promise} = s3UploadTask;

      listrTasks.push({
        title: `Uploading file: ${filename}`,
        task: async (_, listrTask) => {
          try {
            await promise;

            const url =
              type === 'file'
                ? joinUrl(baseUrl, publicPath).replace('{proxy+}', '')
                : joinUrl(baseUrl, publicPath, path.basename(filename));

            listrTask.title = `Successfully uploaded file: ${url}`;
          } catch (error) {
            listrTask.title = `Error while uploading file: ${filename}`;

            throw error;
          }
        }
      });
    }
  }

  await new Listr(listrTasks, {concurrent: true, exitOnError: true}).run();
}

upload.describe = (argv: Argv) =>
  argv.command('upload [options]', 'Upload files to S3', commandArgv =>
    commandArgv.example('npx $0 upload', '')
  );
