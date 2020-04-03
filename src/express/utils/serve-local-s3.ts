import express from 'express';
import * as path from 'path';
import {S3FileConfig} from '../../types';

export interface LocalS3Options {
  readonly enableCors?: boolean;
}

export function serveLocalS3(
  app: express.Express,
  s3FileConfig: S3FileConfig,
  options: LocalS3Options
): void {
  const {publicPath, localPath} = s3FileConfig;

  app.get(publicPath.replace('{proxy+}', '*'), (_req, res) => {
    if (options.enableCors) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.sendFile(path.resolve(localPath));
  });
}
