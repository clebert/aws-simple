import {Terminal, animate, list} from '@rtmpl/terminal';
import {CloudFormation} from 'aws-sdk';
import {green, red, yellow} from 'chalk';
import {dots} from 'cli-spinners';
import {TemplateNode} from 'rtmpl';
import joinUrl from 'url-join';
import {Argv} from 'yargs';
import {createStackBaseUrl} from '../sdk/create-stack-base-url';
import {findStack} from '../sdk/find-stack';
import {resolveS3UploadConfigs} from '../sdk/resolve-s3-upload-configs';
import {uploadFileToS3} from '../sdk/upload-file-to-s3';
import {AppConfig} from '../types';

interface UploadArgv {
  readonly _: ['upload'];
}

function isUploadArgv(argv: {readonly _: unknown[]}): argv is UploadArgv {
  return argv._[0] === 'upload';
}

export async function upload(
  appConfig: AppConfig,
  clientConfig: CloudFormation.ClientConfiguration,
  argv: {readonly _: unknown[]}
): Promise<void> {
  if (!isUploadArgv(argv)) {
    return;
  }

  const stack = await findStack(appConfig, clientConfig);
  const stackConfig = appConfig.createStackConfig();
  const baseUrl = createStackBaseUrl(stackConfig, stack);
  const {s3Configs = []} = stackConfig;
  const Tasks: TemplateNode<string>[] = [];
  const promises: Promise<void>[] = [];

  for (const s3Config of s3Configs) {
    for (const s3UploadConfig of resolveS3UploadConfigs(s3Config)) {
      const {filename, promise} = uploadFileToS3(
        clientConfig,
        stack,
        s3UploadConfig
      );

      const Spinner = TemplateNode.create<string>``;

      animate(Spinner, {
        ...dots,
        frames: dots.frames.map((frame) => yellow(frame)),
      });

      const Task = TemplateNode.create`  ${Spinner} Uploading file: ${filename}`;
      const url = joinUrl(baseUrl, s3UploadConfig.publicPath);

      promise
        .then(
          () => Task.update`  ${green('✔')} Successfully uploaded file: ${url}`
        )
        .catch(
          () =>
            Task.update`  ${red('✖')} Error while uploading file: ${filename}`
        );

      Tasks.push(Task);
      promises.push(promise);
    }
  }

  const close = Terminal.open(
    TemplateNode.create(...list(Tasks, {separator: '\n'}))
  );

  try {
    await Promise.allSettled(promises);
  } catch {
    process.exit(1);
  } finally {
    close();
  }
}

upload.describe = (argv: Argv) =>
  argv.command('upload [options]', 'Upload files to S3', (commandArgv) =>
    commandArgv.example('npx $0 upload', '')
  );
