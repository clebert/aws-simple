import type {LambdaRoute} from '../read-stack-config.js';
import type {APIGatewayProxyResult} from 'aws-lambda';
import type express from 'express';

import {getQueryStringParameters} from './get-querystring-parameters.js';
import {getRequestHeaders} from './get-request-headers.js';
import {getRouterMatcher} from './get-router-matcher.js';
import {dirname, isAbsolute, join, resolve} from 'path';
import {Lambda, LambdaMode} from 'runl';

const createLambdaEvent = (req: express.Request) => {
  const requestBody = req.body
    ? typeof req.body === `string`
      ? req.body
      : JSON.stringify(req.body)
    : null;

  return {
    ...getQueryStringParameters(req),
    ...getRequestHeaders(req),
    requestContext: {
      protocol: req.protocol,
      httpMethod: req.method,
      path: req.path,
      stage: `prod`,
      resourcePath: req.path,
    },
    path: req.path,
    httpMethod: req.method,
    body: requestBody && Buffer.from(requestBody).toString(`base64`),
    isBase64Encoded: Boolean(requestBody),
  };
};

const writeResponse = (
  result: APIGatewayProxyResult,
  req: express.Request,
  res: express.Response,
): void => {
  try {
    const {statusCode, headers, multiValueHeaders, body} = result;

    if (statusCode >= 400) {
      console.error(`Request for ${req.url} failed.`, {statusCode});
    }

    if (headers) {
      Object.entries(headers).forEach(([key, value]) => {
        res.set(key, String(value));
      });
    }

    if (multiValueHeaders) {
      Object.entries(multiValueHeaders).forEach(([key, value]) => {
        res.set(key, value.length === 1 ? String(value[0]) : value.map(String));
      });
    }

    res.status(statusCode).send(body);
  } catch (e) {
    console.log(`Unable to execute lambda local.`, e);
    res.status(500).send({message: JSON.stringify(e)});
  }
};

export const registerLambdaRoute = (
  app: express.Express,
  route: LambdaRoute,
): void => {
  const projectRoot = dirname(resolve(`aws-simple.config.mjs`));
  const lambda = new Lambda({
    autoReload: true,
    environment: {
      ...route.environment,
    },
    lambdaPath: isAbsolute(route.path)
      ? route.path
      : join(projectRoot, route.path),
    lambdaTimeout: route.timeoutInSeconds,
    mode: LambdaMode.Persistent,
    debugPort: route.debugPort,
  });

  getRouterMatcher(app, route.httpMethod)(
    route.publicPath,
    (req, res, next) => {
      lambda
        .execute<APIGatewayProxyResult>(createLambdaEvent(req))
        .then((result) => {
          writeResponse(result, req, res);
        })
        .catch((error) => next(error));
    },
  );
};
