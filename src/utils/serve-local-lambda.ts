import {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import express from 'express';
import lambdaLocal from 'lambda-local';
import {LambdaConfig, LambdaHttpMethod} from '..';
import {Defaults} from '../constants/defaults';

function getHeadersFromRequest(
  req: express.Request
): Pick<APIGatewayProxyEvent, 'headers' | 'multiValueHeaders'> {
  const headers: Record<string, string> = {};
  const multiValueHeaders: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      multiValueHeaders[key] = value;
    } else if (typeof value === 'string') {
      headers[key] = value;
    }
  }

  return {headers, multiValueHeaders};
}

function getRouterMatcher(
  app: express.Express,
  httpMethod: LambdaHttpMethod
): express.IRouterMatcher<express.Express> {
  switch (httpMethod) {
    case 'ANY': {
      return app.all.bind(app);
    }
    case 'DELETE': {
      return app.delete.bind(app);
    }
    case 'GET': {
      return app.get.bind(app);
    }
    case 'HEAD': {
      return app.head.bind(app);
    }
    case 'OPTIONS': {
      return app.options.bind(app);
    }
    case 'PATCH': {
      return app.patch.bind(app);
    }
    case 'POST': {
      return app.post.bind(app);
    }
    case 'PUT': {
      return app.put.bind(app);
    }
  }
}

function createLambdaRequestHandler(
  lambdaConfig: LambdaConfig,
  cached: boolean
): express.RequestHandler {
  const cachedResults = new Map<string, APIGatewayProxyResult>();

  const {
    localPath,
    handler = Defaults.lambdaHandler,
    timeoutInSeconds = Defaults.lambdaTimeoutInSeconds,
    environment
  } = lambdaConfig;

  return async (req, res) => {
    try {
      const result =
        cachedResults.get(req.url) ||
        (await lambdaLocal.execute({
          lambdaPath: localPath,
          lambdaHandler: handler,
          timeoutMs: timeoutInSeconds * 1000,
          environment,
          event: {
            ...getHeadersFromRequest(req),
            path: req.path,
            queryStringParameters: req.query
          }
        }));

      if (cached) {
        cachedResults.set(req.url, result);
      }

      const {headers, statusCode, body} = result;

      if (headers) {
        for (const key of Object.keys(headers)) {
          res.set(key, String(headers[key]));
        }
      }

      res.status(statusCode).send(body);
    } catch (error) {
      res.status(500).send(error);
    }
  };
}

export function serveLocalLambda(
  app: express.Express,
  lambdaConfig: LambdaConfig,
  cached: boolean
): void {
  const {httpMethod, publicPath} = lambdaConfig;

  getRouterMatcher(app, httpMethod)(
    publicPath,
    createLambdaRequestHandler(lambdaConfig, cached)
  );
}
