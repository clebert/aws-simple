import {existsSync, lstatSync, readdirSync} from 'fs';
import * as path from 'path';
import {S3Config} from '..';

export function resolveFilenames(s3Config: S3Config): string[] {
  const {type, localPath} = s3Config;

  if (type === 'file') {
    if (!existsSync(localPath) || !lstatSync(localPath).isFile()) {
      throw new Error(
        `Expect the specified local path to be an existing file: ${localPath}`
      );
    }

    return [path.resolve(localPath)];
  }

  if (!existsSync(localPath) || !lstatSync(localPath).isDirectory()) {
    throw new Error(
      `Expect the specified local path to be an existing directory: ${localPath}`
    );
  }

  return readdirSync(localPath)
    .map(filename => path.resolve(path.join(localPath, filename)))
    .filter(filename => lstatSync(filename).isFile());
}
