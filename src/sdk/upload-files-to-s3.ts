import {CloudFormation, S3} from 'aws-sdk';
import {readFileSync} from 'fs';
import mimeTypes from 'mime-types';
import * as path from 'path';
import {S3Config} from '../types';
import {resolveFilenames} from '../utils/resolve-filenames';
import {findStackOutput} from './find-stack-output';

export interface S3UploadTask {
  readonly filename: string;
  readonly promise: Promise<void>;
}

export function uploadFilesToS3(
  clientConfig: CloudFormation.ClientConfiguration,
  stack: CloudFormation.Stack,
  s3Config: S3Config
): S3UploadTask[] {
  const s3 = new S3(clientConfig);
  const s3BucketName = findStackOutput(stack, 'S3BucketName');
  const {type, publicPath, bucketPath = publicPath} = s3Config;

  return resolveFilenames(s3Config).map(filename => ({
    filename,
    promise: (async () => {
      await s3
        .upload({
          ContentType: mimeTypes.lookup(filename) || undefined,
          Bucket: s3BucketName,
          Key: (type === 'folder'
            ? path.join(bucketPath, path.basename(filename))
            : bucketPath
          ).replace(/^\//, ''),
          Body: readFileSync(filename)
        })
        .promise();
    })()
  }));
}
