import type {ObjectIdentifier} from '@aws-sdk/client-s3';
import {
  DeleteBucketCommand,
  DeleteObjectsCommand,
  ListObjectsCommand,
  S3Client,
} from '@aws-sdk/client-s3';

export async function deleteBucket(bucketName: string): Promise<void> {
  const client = new S3Client({});

  const {Contents} = await client.send(
    new ListObjectsCommand({Bucket: bucketName}),
  );

  const objectIdentifiers =
    Contents?.filter(
      (object): object is ObjectIdentifier => typeof object.Key === `string`,
    ).map(({Key}) => ({Key})) ?? [];

  if (objectIdentifiers.length > 0) {
    await client.send(
      new DeleteObjectsCommand({
        Bucket: bucketName,
        Delete: {Objects: objectIdentifiers},
      }),
    );
  }

  await client.send(new DeleteBucketCommand({Bucket: bucketName}));
}
