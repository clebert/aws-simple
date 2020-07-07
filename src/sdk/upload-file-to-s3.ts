import {CloudFormation, S3} from 'aws-sdk';
import {readFileSync} from 'fs';
import mimeTypes from 'mime-types';
import {findStackOutput} from './find-stack-output';
import {S3UploadConfig} from './resolve-s3-upload-configs';

export interface S3UploadTask {
  readonly filename: string;
  readonly promise: Promise<void>;
}

export function uploadFileToS3(
  clientConfig: CloudFormation.ClientConfiguration,
  stack: CloudFormation.Stack,
  s3UploadConfig: S3UploadConfig
): S3UploadTask {
  const s3 = new S3(clientConfig);
  const s3BucketName = findStackOutput(stack, 'S3BucketName');
  const {localPath, bucketPath} = s3UploadConfig;

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
