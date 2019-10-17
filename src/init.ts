import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const awsConfigFile = process.env.AWS_CONFIG_FILE
  ? process.env.AWS_CONFIG_FILE
  : path.join(os.homedir(), '.aws', 'config');

const sharedCredentialsFile = process.env.AWS_SHARED_CREDENTIALS_FILE
  ? process.env.AWS_SHARED_CREDENTIALS_FILE
  : path.join(os.homedir(), '.aws', 'credentials');

if (fs.existsSync(awsConfigFile) && !fs.existsSync(sharedCredentialsFile)) {
  /*
   * Write an empty credentials file if there's a config file,
   * otherwise the AWS SDK will throw an error.
   */
  fs.writeFileSync(sharedCredentialsFile, '');
}

if (fs.existsSync(sharedCredentialsFile)) {
  /*
   * Ensure that the AWS SDK will load region from ~/.aws/config
   * if the environment variable AWS_REGION is not set.
   */
  process.env.AWS_SDK_LOAD_CONFIG = '1';
}

/*
 * Set environment variables so we behave as close as possible to the AWS CLI.
 */
if (process.env.AWS_DEFAULT_PROFILE && !process.env.AWS_PROFILE) {
  process.env.AWS_PROFILE = process.env.AWS_DEFAULT_PROFILE;
}

if (process.env.AWS_DEFAULT_REGION && !process.env.AWS_REGION) {
  process.env.AWS_REGION = process.env.AWS_DEFAULT_REGION;
}
