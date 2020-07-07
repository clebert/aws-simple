import express from 'express';
import * as path from 'path';
import {S3Config} from '../../types';
import {createExpressPath} from './create-express-path';

export function registerS3Route(
  app: express.Express,
  s3Config: S3Config,
  enableCors: boolean
): void {
  const {type, publicPath, localPath} = s3Config;

  if (type === 'file') {
    app.get(createExpressPath(publicPath), (_req, res) => {
      if (enableCors) {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }

      res.sendFile(path.resolve(localPath));
    });
  } else {
    app.use(
      publicPath.replace('{proxy+}', ''),
      express.static(path.resolve(localPath), {
        setHeaders: (res) => {
          if (enableCors) {
            res.setHeader('Access-Control-Allow-Origin', '*');
          }
        },
      })
    );
  }
}
