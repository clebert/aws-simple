import type {APIGatewayProxyResult} from 'aws-lambda';
import type express from 'express';
import * as lambdaLocal from 'lambda-local';
import type {LambdaRoute} from '../read-stack-config.js';
import {print} from '../utils/print.js';
import {getQueryStringParameters} from './get-querystring-parameters.js';
import {getRequestHeaders} from './get-request-headers.js';

export function createLambdaRequestHandler(
  route: LambdaRoute,
  cache: Map<string, APIGatewayProxyResult> | undefined,
): express.RequestHandler {
  const {path, functionName, timeoutInSeconds = 28, environment} = route;

  return async (req, res) => {
    try {
      const cachedResult = cache?.get(req.url);

      const result =
        cachedResult ||
        (await lambdaLocal.execute({
          lambdaPath: path,
          lambdaHandler: `handler`,
          timeoutMs: timeoutInSeconds * 1000,
          environment,
          event: {
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
            body: req.body
              ? typeof req.body === `string`
                ? req.body
                : JSON.stringify(req.body)
              : null,
          },
        }));

      const {headers, statusCode, body, isBase64Encoded} = result;

      if (cachedResult) {
        print.info(`Cache hit for Lambda request handler: ${functionName}`);
      } else if (cache) {
        print.info(`Cache miss for Lambda request handler: ${functionName}`);

        if (statusCode === 200) {
          cache.set(req.url, result);
        }
      }

      if (headers) {
        for (const key of Object.keys(headers)) {
          res.set(key, String(headers[key]));
        }
      }

      res.status(statusCode);

      if (isBase64Encoded) {
        res.end(body, `base64`);
      } else {
        res.send(body);
      }
    } catch (error) {
      res.status(500).send(error);
    }
  };
}
