import {lstat, readFile} from 'fs/promises';
import {isAbsolute} from 'path';
import {PutObjectCommand, S3Client} from '@aws-sdk/client-s3';
import {lookup} from 'mime-types';

export async function uploadFile(
  bucketName: string,
  path: string,
): Promise<void> {
  if (!(await lstat(path)).isFile()) {
    throw new Error(`The path does not refer to a file: ${path}`);
  }

  if (isAbsolute(path)) {
    throw new Error(`The path must be relative: ${path}`);
  }

  await new S3Client({}).send(
    new PutObjectCommand({
      ContentType: lookup(path) || undefined,
      Bucket: bucketName,
      Key: path,
      Body: await readFile(path),
    }),
  );
}
