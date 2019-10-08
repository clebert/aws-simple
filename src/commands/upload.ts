import {Argv} from 'yargs';
import {Context} from '../context';
import {defaults} from '../defaults';
import {uploadToS3} from '../sdk/upload-to-s3';
import {loadAppConfig} from '../utils/load-app-config';

export interface UploadArgv {
  readonly _: ['upload'];
  readonly config: string;
  readonly profile: string;
  readonly stackName?: string;
}

export async function upload(argv: UploadArgv): Promise<void> {
  const {config, profile, stackName} = argv;
  const context = new Context(loadAppConfig(config, stackName));

  await uploadToS3(context, profile);
}

upload.describe = (yargs: Argv) =>
  yargs.command('upload [options]', 'Upload files to S3', args =>
    args
      .describe('config', 'The path to the config file')
      .string('config')
      .default('config', defaults.configFilename)

      .describe(
        'profile',
        'The AWS profile name as set in the shared credentials file'
      )
      .string('profile')
      .demandOption('profile')

      .describe(
        'stack-name',
        'Optional overwriting of the stack name declared in the config file'
      )
      .string('stack-name')

      .example('$0 upload --profile clebert', '')
      .example('$0 upload --profile clebert --stack-name stage', '')
  );

upload.matches = (argv: {_: string[]}): argv is UploadArgv =>
  argv._[0] === 'upload';
