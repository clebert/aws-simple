import {animate, list, render} from '@rtmpl/terminal';
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
  const nodes: TemplateNode<string>[] = [];
  const promises: Promise<void>[] = [];

  for (const s3Config of s3Configs) {
    for (const s3UploadConfig of resolveS3UploadConfigs(s3Config)) {
      const {filename, promise} = uploadFileToS3(
        clientConfig,
        stack,
        s3UploadConfig
      );

      const spinnerNode = TemplateNode.create<string>``;

      animate(spinnerNode, {
        ...dots,
        frames: dots.frames.map((frame) => yellow(frame)),
      });

      const node = TemplateNode.create`  ${spinnerNode} Uploading file: ${filename}`;
      const url = joinUrl(baseUrl, s3UploadConfig.publicPath);

      promise
        .then(
          () => node.update`  ${green('✔')} Successfully uploaded file: ${url}`
        )
        .catch(
          () =>
            node.update`  ${red('✖')} Error while uploading file: ${filename}`
        );

      nodes.push(node);
      promises.push(promise);
    }
  }

  render(TemplateNode.create(...list(nodes, {separator: '\n'})), {
    debounce: true,
  });

  await Promise.allSettled(promises).catch(() => process.exit(1));
}

upload.describe = (argv: Argv) =>
  argv.command('upload [options]', 'Upload files to S3', (commandArgv) =>
    commandArgv.example('npx $0 upload', '')
  );
