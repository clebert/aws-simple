import {resolve} from 'path';
import type {Express} from 'express';
import express from 'express';
import type {S3Route} from '../read-stack-config.js';

export function registerS3Route(app: Express, route: S3Route): void {
  const {type, publicPath, path, corsEnabled} = route;

  if (type === `file`) {
    app.get(publicPath, (_req, res) => {
      if (corsEnabled) {
        res.setHeader(`Access-Control-Allow-Origin`, `*`);
      }

      res.sendFile(resolve(path));
    });
  } else {
    app.use(
      publicPath.replace(`/*`, ``),
      express.static(resolve(path), {
        setHeaders: (res) => {
          if (corsEnabled) {
            res.setHeader(`Access-Control-Allow-Origin`, `*`);
          }
        },
      }),
    );
  }
}
