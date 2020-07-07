import {lstatSync, readdirSync} from 'fs';
import * as path from 'path';
import {S3Config} from '../types';

export interface S3UploadConfig {
  readonly publicPath: string;
  readonly localPath: string;
  readonly bucketPath: string;
}

export function resolveS3UploadConfigs(s3Config: S3Config): S3UploadConfig[] {
  const s3UploadConfigs: S3UploadConfig[] = [];
  const {publicPath, localPath, bucketPath = publicPath} = s3Config;

  if (s3Config.type === 'file') {
    s3UploadConfigs.push({publicPath, localPath, bucketPath});
  } else {
    if (publicPath.includes('{proxy+}')) {
      throw new Error(
        'A catch-all S3 config is only supported for single files.'
      );
    }

    const filenames = readdirSync(localPath)
      .map((filename) => path.resolve(path.join(localPath, filename)))
      .filter((filename) => lstatSync(filename).isFile());

    for (const filename of filenames) {
      s3UploadConfigs.push({
        publicPath: path.join(publicPath, path.basename(filename)),
        localPath: filename,
        bucketPath: path.join(bucketPath, path.basename(filename)),
      });
    }
  }

  return s3UploadConfigs;
}
