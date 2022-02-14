import type {Express, IRouterMatcher} from 'express';
import type {LambdaRoute} from '../read-stack-config';

export function getRouterMatcher(
  app: Express,
  httpMethod: LambdaRoute['httpMethod'],
): IRouterMatcher<Express> {
  switch (httpMethod) {
    case `DELETE`: {
      return app.delete.bind(app);
    }
    case `GET`: {
      return app.get.bind(app);
    }
    case `HEAD`: {
      return app.head.bind(app);
    }
    case `PATCH`: {
      return app.patch.bind(app);
    }
    case `POST`: {
      return app.post.bind(app);
    }
    case `PUT`: {
      return app.put.bind(app);
    }
    default: {
      assertUnreachable(httpMethod);
    }
  }
}

function assertUnreachable(_: never): never {
  throw new Error();
}
