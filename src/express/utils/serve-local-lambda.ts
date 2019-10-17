import express from 'express';
import {LambdaConfig} from '../../types';
import {createLambdaRequestHandler} from './create-lambda-request-handler';
import {getRouterMatcher} from './get-router-matcher';

export function serveLocalLambda(
  app: express.Express,
  port: number,
  lambdaConfig: LambdaConfig,
  useCache: boolean
): void {
  const {httpMethod, publicPath} = lambdaConfig;

  getRouterMatcher(app, httpMethod)(
    publicPath,
    createLambdaRequestHandler(port, lambdaConfig, useCache)
  );
}
