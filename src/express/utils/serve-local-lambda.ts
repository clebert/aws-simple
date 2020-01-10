import express from 'express';
import {LambdaConfig} from '../../types';
import {createLambdaRequestHandler} from './create-lambda-request-handler';
import {getRouterMatcher} from './get-router-matcher';

export function serveLocalLambda(
  app: express.Express,
  lambdaConfig: LambdaConfig,
  useCache: boolean
): void {
  const {httpMethod, publicPath} = lambdaConfig;

  const normalizedPublicPath = publicPath.replace('{proxy+}', '*');

  getRouterMatcher(app, httpMethod)(
    normalizedPublicPath,
    createLambdaRequestHandler(lambdaConfig, useCache)
  );
}
