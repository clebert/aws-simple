import {Argv} from 'yargs';
import {Defaults} from '../defaults';
import {AppConfig} from '../utils/app-config';
import {uploadToS3} from '../utils/upload-to-s3';

export interface UploadArgv {
  readonly _: ['upload'];
  readonly config: string;
  readonly profile: string;
  readonly region: string;
  readonly stackId?: string;
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

      .describe(
        'stack-id',
        'Optional overwriting of the stack ID declared in the config file'
      )
      .string('stack-id')
  );
}

export function isUploadArgv(argv: {_: string[]}): argv is UploadArgv {
  return argv._[0] === 'upload';
}

export async function upload(argv: UploadArgv): Promise<void> {
  const {config, profile, region, stackId} = argv;

  await uploadToS3(AppConfig.load(config, stackId), {profile, region});
}
