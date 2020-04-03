import {S3FileConfig} from '../types';

export function sortS3FileConfigs(
  s3FileConfigs: readonly S3FileConfig[]
): readonly S3FileConfig[] {
  return [...s3FileConfigs].sort(({publicPath: a}, {publicPath: b}) =>
    a > b ? 1 : -1
  );
}
