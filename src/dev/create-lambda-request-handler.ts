import type {APIGatewayProxyResult} from 'aws-lambda';
import type express from 'express';
import * as lambdaLocal from 'lambda-local';
import type {LambdaRoute} from '../stack-config.js';
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

      const requestBody =
        typeof req.body === `string` && req.body ? req.body : null;

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
            body: requestBody && Buffer.from(requestBody).toString(`base64`),
            isBase64Encoded: Boolean(requestBody),
          },
        }));

      const {headers, multiValueHeaders, statusCode, body, isBase64Encoded} =
        result;

      if (cachedResult) {
        print.info(`Cache hit for Lambda request handler: ${functionName}`);
      } else if (cache) {
        print.info(`Cache miss for Lambda request handler: ${functionName}`);

        if (statusCode === 200) {
          cache.set(req.url, result);
        }
      }

      if (headers) {
        for (const [key, value] of Object.entries(headers)) {
          res.set(key, String(value));
        }
      }

      if (multiValueHeaders) {
        for (const [key, values] of Object.entries(multiValueHeaders)) {
          // Using `set` instead of `append` here because the API Gateway docs
          // define: "If you specify values for both headers and
          // multiValueHeaders, API Gateway merges them into a single list. If
          // the same key-value pair is specified in both, only the values from
          // multiValueHeaders will appear in the merged list."
          res.set(key, values.map(String));
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
