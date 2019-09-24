import {Argv} from 'yargs';
import {Defaults} from '../constants/defaults';
import {loadStackConfig} from '../utils/load-stack-config';
import {uploadToS3} from '../utils/upload-to-s3';

export interface UploadArgv {
  readonly _: ['upload'];
  readonly config: string;
  readonly profile: string;
  readonly region: string;
}

export function describeUploadCommand(yargs: Argv): Argv {
  return yargs.command('upload [options]', 'Upload files to S3', args =>
    args
      .describe('config', 'The path to the config file')
      .string('config')
      .default('config', Defaults.configFilename)

      .describe(
        'profile',
        'The AWS profile name as set in the shared credentials file'
      )
      .string('profile')
      .demandOption('profile')

      .describe('region', 'The AWS region')
      .string('region')
      .demandOption('region')
  );
}

export function isUploadArgv(argv: {_: string[]}): argv is UploadArgv {
  return argv._[0] === 'upload';
}

export async function upload(argv: UploadArgv): Promise<void> {
  const {config, profile, region} = argv;

  await uploadToS3(loadStackConfig(config), {profile, region});
}
