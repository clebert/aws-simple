import type {LambdaRoute, S3Route} from '../read-stack-config.js';

import {validateRoutes} from './validate-routes.js';
import {describe, expect, test} from '@jest/globals';

const lambdaRoute: Omit<LambdaRoute, 'publicPath' | 'functionName'> = {
  type: `function`,
  httpMethod: `GET`,
  path: ``,
};

const s3FileRoute: Omit<S3Route, 'publicPath'> = {type: `file`, path: ``};
const s3FolderRoute: Omit<S3Route, 'publicPath'> = {type: `folder`, path: ``};

describe(`validateRoutes()`, () => {
  test(`does not throw an error`, () => {
    validateRoutes([]);

    validateRoutes([
      {...s3FileRoute, publicPath: `/foo`},
      {...s3FileRoute, publicPath: `/*`},
    ]);

    validateRoutes([
      {...s3FileRoute, publicPath: `/`},
      {...s3FolderRoute, publicPath: `/*`},
    ]);

    validateRoutes([
      {...s3FolderRoute, publicPath: `/*`},
      {...s3FileRoute, publicPath: `/`},
    ]);

    validateRoutes([
      {...lambdaRoute, publicPath: `/`, functionName: `foo`},
      {...s3FolderRoute, publicPath: `/*`},
    ]);

    validateRoutes([
      {...s3FolderRoute, publicPath: `/*`},
      {...lambdaRoute, publicPath: `/`, functionName: `foo`},
    ]);

    validateRoutes([
      {
        ...lambdaRoute,
        publicPath: `/`,
        httpMethod: `GET`,
        functionName: `foo`,
      },
      {
        ...lambdaRoute,
        publicPath: `/`,
        httpMethod: `POST`,
        functionName: `bar`,
      },
    ]);

    validateRoutes([
      {
        ...lambdaRoute,
        publicPath: `/*`,
        httpMethod: `GET`,
        functionName: `foo`,
      },
      {
        ...lambdaRoute,
        publicPath: `/`,
        httpMethod: `POST`,
        functionName: `bar`,
      },
    ]);
  });

  test(`throws an error`, () => {
    expect(() =>
      validateRoutes([
        {...s3FileRoute, publicPath: `/`},
        {...s3FileRoute, publicPath: `/*`},
      ]),
    ).toThrow(new Error(`A public path must be unique per HTTP method: GET /`));

    expect(() =>
      validateRoutes([
        {...s3FileRoute, publicPath: `/*`},
        {...s3FileRoute, publicPath: `/`},
      ]),
    ).toThrow(new Error(`A public path must be unique per HTTP method: GET /`));

    expect(() =>
      validateRoutes([
        {...lambdaRoute, publicPath: `/`, functionName: `foo`},
        {...lambdaRoute, publicPath: `/*`, functionName: `bar`},
      ]),
    ).toThrow(new Error(`A public path must be unique per HTTP method: GET /`));

    expect(() =>
      validateRoutes([
        {...lambdaRoute, publicPath: `/*`, functionName: `foo`},
        {...lambdaRoute, publicPath: `/`, functionName: `bar`},
      ]),
    ).toThrow(new Error(`A public path must be unique per HTTP method: GET /`));

    expect(() =>
      validateRoutes([
        {
          ...lambdaRoute,
          publicPath: `/`,
          functionName: `foo`,
          httpMethod: `POST`,
        },
        {
          ...lambdaRoute,
          publicPath: `/`,
          functionName: `bar`,
          httpMethod: `POST`,
        },
      ]),
    ).toThrow(
      new Error(`A public path must be unique per HTTP method: POST /`),
    );

    expect(() =>
      validateRoutes([
        {...s3FileRoute, publicPath: `/`},
        {...lambdaRoute, publicPath: `/*`, functionName: `foo`},
      ]),
    ).toThrow(new Error(`A public path must be unique per HTTP method: GET /`));

    expect(() =>
      validateRoutes([
        {...lambdaRoute, publicPath: `/`, functionName: `foo`},
        {...s3FileRoute, publicPath: `/*`},
      ]),
    ).toThrow(new Error(`A public path must be unique per HTTP method: GET /`));

    expect(() =>
      validateRoutes([
        {...s3FileRoute, publicPath: `/foo`},
        {...s3FileRoute, publicPath: `/foo/*`},
      ]),
    ).toThrow(
      new Error(`A public path must be unique per HTTP method: GET /foo`),
    );

    expect(() =>
      validateRoutes([{...s3FileRoute, publicPath: `/foo/`}]),
    ).toThrow(
      new Error(
        `A public path other than root must not end with a slash: /foo/`,
      ),
    );

    expect(() =>
      validateRoutes([{...s3FileRoute, publicPath: `/foo/*/bar`}]),
    ).toThrow(
      new Error(
        `A public path may contain a wildcard only at the end: /foo/*/bar`,
      ),
    );

    expect(() =>
      validateRoutes([{...s3FolderRoute, publicPath: `/foo`}]),
    ).toThrow(
      new Error(
        `A public path of an S3 folder route must end with a wildcard: /foo`,
      ),
    );

    expect(() =>
      validateRoutes([
        {...lambdaRoute, publicPath: `/foo`, functionName: `foo bar`},
        {...lambdaRoute, publicPath: `/bar`, functionName: `foo_bar`},
      ]),
    ).toThrow(new Error(`A normalized function name must be unique: foo-bar`));
  });
});
