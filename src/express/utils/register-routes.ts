import express from 'express';
import {StackConfig} from '../../types';
import {resolveS3FileConfigs} from '../../utils/resolve-s3-file-configs';
import {serveLocalLambda} from './serve-local-lambda';
import {serveLocalS3} from './serve-local-s3';
import {sortS3FileConfigs} from './sort-s3-file-configs';

export function registerRoutes(
  app: express.Express,
  stackConfig: StackConfig,
  useCache: boolean
): void {
  const {lambdaConfigs = [], s3Configs = [], enableCors} = stackConfig;

  for (const lambdaConfig of lambdaConfigs) {
    serveLocalLambda(app, lambdaConfig, {useCache});
  }

  const s3FileConfigs = resolveS3FileConfigs(s3Configs);

  for (const s3FileConfig of sortS3FileConfigs(s3FileConfigs)) {
    serveLocalS3(app, s3FileConfig, {enableCors});
  }
}
