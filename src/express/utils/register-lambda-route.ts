import type {APIGatewayProxyResult} from 'aws-lambda';
import type express from 'express';
import type {LambdaConfig} from '../../types';
import {createExpressPath} from './create-express-path';
import {createLambdaRequestHandler} from './create-lambda-request-handler';
import {getRouterMatcher} from './get-router-matcher';

export function registerLambdaRoute(
  app: express.Express,
  lambdaConfig: LambdaConfig,
  lambdaCache: Map<string, APIGatewayProxyResult> | undefined,
): void {
  const {httpMethod, publicPath} = lambdaConfig;

  getRouterMatcher(app, httpMethod)(
    createExpressPath(publicPath),
    createLambdaRequestHandler(lambdaConfig, lambdaCache),
  );
}
