import express from 'express';
import * as path from 'path';
import {S3Config} from '../../types';

export interface LocalS3Options {
  readonly enableCors?: boolean;
}

export function serveLocalS3(
  app: express.Express,
  s3Config: S3Config,
  options: LocalS3Options
): void {
  const {type, publicPath, localPath} = s3Config;

  const setHeaders = (res: express.Response): void => {
    if (options.enableCors) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
  };

  if (type === 'file') {
    app.get(publicPath.replace('{proxy+}', '*'), (_req, res) => {
      setHeaders(res);

      res.sendFile(path.resolve(localPath));
    });
  } else {
    app.use(
      publicPath.replace('{proxy+}', ''),
      express.static(path.resolve(localPath), {setHeaders})
    );
  }
}
