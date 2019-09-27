import {Argv} from 'yargs';
import {defaults} from '../defaults';
import {DeploymentDescriptor} from '../utils/deployment-descriptor';
import {loadAppConfig} from '../utils/load-app-config';
import {uploadToS3} from '../utils/sdk/upload-to-s3';

export interface UploadArgv {
  readonly _: ['upload'];
  readonly config: string;
  readonly profile: string;
  readonly region: string;
  readonly stackName?: string;
}

export function describeUploadCommand(yargs: Argv): Argv {
  return yargs.command('upload [options]', 'Upload files to S3', args =>
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

      .describe('region', 'The AWS region')
      .string('region')
      .demandOption('region')

      .describe(
        'stack-name',
        'Optional overwriting of the stack name declared in the config file'
      )
      .string('stack-name')

      .example('$0 upload --profile clebert --region eu-central-1', '')

      .example(
        '$0 upload --profile clebert --region eu-central-1 --stack-name stage',
        ''
      )
  );
}

export function isUploadArgv(argv: {_: string[]}): argv is UploadArgv {
  return argv._[0] === 'upload';
}

export async function upload(argv: UploadArgv): Promise<void> {
  const {config, profile, region, stackName} = argv;

  const deploymentDescriptor = new DeploymentDescriptor(
    loadAppConfig(config, stackName)
  );

  await uploadToS3(deploymentDescriptor, {profile, region});
}
