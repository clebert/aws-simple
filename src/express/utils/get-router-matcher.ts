import type express from 'express';
import type {LambdaHttpMethod} from '../../types';

export function getRouterMatcher(
  app: express.Express,
  httpMethod: LambdaHttpMethod
): express.IRouterMatcher<express.Express> {
  switch (httpMethod) {
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
