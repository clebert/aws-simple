import {Argv} from 'yargs';
import {Context} from '../context';
import {defaults} from '../defaults';
import {uploadToS3} from '../sdk/upload-to-s3';

export interface UploadArgv {
  readonly _: ['upload'];
  readonly config: string;
  readonly stackName?: string;
}

export async function upload(argv: UploadArgv): Promise<void> {
  const {config, stackName} = argv;

  await uploadToS3(Context.load(config, stackName));
}

upload.describe = (yargs: Argv) =>
  yargs.command('upload [options]', 'Upload files to S3', args =>
    args
      .describe('config', 'The path to the config file')
      .string('config')
      .default('config', defaults.configFilename)

      .describe(
        'stack-name',
        'The stack name to be used instead of the default one declared in the config file'
      )
      .string('stack-name')

      .example('npx $0 upload', '')
      .example('npx $0 upload --stack-name stage', '')
  );

upload.matches = (argv: {_: string[]}): argv is UploadArgv =>
  argv._[0] === 'upload';
