import {validateRoutes} from './validate-routes';

describe(`validateRoutes()`, () => {
  test(`does not throw an error`, () => {
    validateRoutes([]);

    validateRoutes([
      {type: `file`, publicPath: `/`, path: ``},
      {type: `folder`, publicPath: `/*`, path: ``},
      {
        type: `function`,
        httpMethod: `GET`,
        publicPath: `/foo`,
        path: ``,
        functionName: `foobar`,
      },
      {
        type: `function`,
        httpMethod: `GET`,
        publicPath: `/foo/*`,
        path: ``,
        functionName: `foo_bar`,
      },
    ]);
  });

  test(`throws an error`, () => {
    expect(() =>
      validateRoutes([
        {type: `file`, publicPath: `/*`, path: ``},
        {type: `folder`, publicPath: `/*`, path: ``},
      ]),
    ).toThrow(new Error(`A public path must be unique: /*`));

    expect(() =>
      validateRoutes([{type: `file`, publicPath: `/*/`, path: ``}]),
    ).toThrow(
      new Error(`A public path other than root must not end with a slash: /*/`),
    );

    expect(() =>
      validateRoutes([{type: `file`, publicPath: `/*/foo`, path: ``}]),
    ).toThrow(
      new Error(`A public path may contain a wildcard only at the end: /*/foo`),
    );

    expect(() =>
      validateRoutes([{type: `folder`, publicPath: `/`, path: ``}]),
    ).toThrow(
      new Error(
        `A public path of an S3 folder route must end with a wildcard: /`,
      ),
    );

    expect(() =>
      validateRoutes([
        {
          type: `function`,
          httpMethod: `GET`,
          publicPath: `/foo`,
          path: ``,
          functionName: `foo bar`,
        },
        {
          type: `function`,
          httpMethod: `GET`,
          publicPath: `/foo/*`,
          path: ``,
          functionName: `foo_bar`,
        },
      ]),
    ).toThrow(new Error(`A normalized function name must be unique: foo-bar`));
  });
});
