import express from 'express';
import * as path from 'path';
import {S3Config} from '../../types';

export function serveLocalS3(app: express.Express, s3Config: S3Config): void {
  const {type, publicPath, localPath, responseHeaders = {}} = s3Config;

  const setHeaders = (res: express.Response): void => {
    const {accessControlAllowOrigin} = responseHeaders;

    if (accessControlAllowOrigin) {
      res.setHeader('Access-Control-Allow-Origin', accessControlAllowOrigin);
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
