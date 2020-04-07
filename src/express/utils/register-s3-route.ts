import express from 'express';
import * as path from 'path';
import {S3FileConfig} from '../../types';

export function registerS3Route(
  app: express.Express,
  s3FileConfig: S3FileConfig,
  enableCors: boolean
): void {
  const {publicPath, localPath} = s3FileConfig;

  app.get(publicPath.replace('{proxy+}', '*'), (_req, res) => {
    if (enableCors) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }

    res.sendFile(path.resolve(localPath));
  });
}
