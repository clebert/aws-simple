import {CloudFormation, S3} from 'aws-sdk';
import {readFileSync} from 'fs';
import mimeTypes from 'mime-types';
import {S3FileConfig} from '../types';
import {findStackOutput} from './find-stack-output';

export interface S3UploadTask {
  readonly filename: string;
  readonly promise: Promise<void>;
}

export function uploadFileToS3(
  clientConfig: CloudFormation.ClientConfiguration,
  stack: CloudFormation.Stack,
  s3FileConfig: S3FileConfig
): S3UploadTask {
  const s3 = new S3(clientConfig);
  const s3BucketName = findStackOutput(stack, 'S3BucketName');
  const {publicPath, localPath, bucketPath = publicPath} = s3FileConfig;

  return {
    filename: localPath,
    promise: (async () => {
      await s3
        .upload({
          ContentType: mimeTypes.lookup(localPath) || undefined,
          Bucket: s3BucketName,
          Key: bucketPath.replace(/^\//, ''),
          Body: readFileSync(localPath),
        })
        .promise();
    })(),
  };
}
