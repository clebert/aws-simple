import {lstatSync, readdirSync} from 'fs';
import * as path from 'path';
import {S3Config, S3FileConfig} from '../types';

function isS3FileConfig(s3Config: S3Config): s3Config is S3FileConfig {
  return s3Config.type === 'file';
}

export function resolveS3FileConfigs(s3Configs: S3Config[]): S3FileConfig[] {
  const s3FileConfigs: S3FileConfig[] = [];

  for (const s3Config of s3Configs) {
    if (isS3FileConfig(s3Config)) {
      s3FileConfigs.push(s3Config);
    } else {
      const {publicPath, localPath, bucketPath = publicPath} = s3Config;

      if (publicPath.includes('{proxy+}')) {
        throw new Error(
          'A catch-all S3 config is only supported for single files.'
        );
      }

      const filenames = readdirSync(localPath)
        .map((filename) => path.resolve(path.join(localPath, filename)))
        .filter((filename) => lstatSync(filename).isFile());

      for (const filename of filenames) {
        s3FileConfigs.push({
          ...s3Config,
          type: 'file',
          publicPath: path.join(publicPath, path.basename(filename)),
          localPath: filename,
          bucketPath: path.join(bucketPath, path.basename(filename)),
        });
      }
    }
  }

  return s3FileConfigs;
}
