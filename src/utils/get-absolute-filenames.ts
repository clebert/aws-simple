import {readdirSync} from 'fs';
import * as path from 'path';
import {S3Config} from '..';

export function getAbsoluteFilenames(s3Config: S3Config): string[] {
  const {type, localPath} = s3Config;

  const relativeFilenames =
    type === 'file'
      ? [localPath]
      : readdirSync(localPath).map(filename => path.join(localPath, filename));

  return relativeFilenames.map(filename => path.resolve(filename));
}
