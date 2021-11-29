import type {APIGatewayProxyResult} from 'aws-lambda';
import type express from 'express';
import * as lambdaLocal from 'lambda-local';
import type {LambdaConfig} from '../../types';
import {getLambdaModuleName as checkLambdaModuleName} from '../../utils/get-lambda-module-name';
import {getRequestHeaders} from './get-request-headers';
import {logInfo} from './log-info';

export function createLambdaRequestHandler(
  lambdaConfig: LambdaConfig,
  lambdaCache: Map<string, APIGatewayProxyResult> | undefined
): express.RequestHandler {
  const {
    localPath,
    handler = 'handler',
    timeoutInSeconds = 28,
    environment,
  } = lambdaConfig;

  checkLambdaModuleName(localPath);

  return async (req, res) => {
    try {
      const cachedResult = lambdaCache?.get(req.url);
      const queryStringParameters: Record<string, string> = {};

      for (const key of Object.keys(req.query)) {
        const parameter = req.query[key];

        if (typeof parameter === 'string') {
          queryStringParameters[key] = parameter;
        }
      }

      const result =
        cachedResult ||
        (await lambdaLocal.execute({
          lambdaPath: localPath,
          lambdaHandler: handler,
          timeoutMs: timeoutInSeconds * 1000,
          environment,
          event: {
            ...getRequestHeaders(req),
            path: req.path,
            httpMethod: req.method,
            queryStringParameters,
            body: req.body
              ? typeof req.body === 'string'
                ? req.body
                : JSON.stringify(req.body)
              : null,
          },
        }));

      const {headers, statusCode, body, isBase64Encoded} = result;

      if (!cachedResult && statusCode === 200) {
        lambdaCache?.set(req.url, result);
      }

      if (headers) {
        for (const key of Object.keys(headers)) {
          res.set(key, String(headers[key]));
        }
      }

      if (cachedResult) {
        logInfo(`DEV server cache hit for Lambda request: ${req.url}`);
      }

      res.status(statusCode);

      if (isBase64Encoded) {
        res.end(body, 'base64');
      } else {
        res.send(body);
      }
    } catch (error) {
      res.status(500).send(error);
    }
  };
}
