import { sortRoutes } from './sort-routes.js';
import { describe, expect, test } from '@jest/globals';

describe(`sortRoutes()`, () => {
  test(`returns the given routes sorted by specificity`, () => {
    expect(sortRoutes([])).toEqual([]);
    expect(sortRoutes([{ publicPath: `/` }])).toEqual([{ publicPath: `/` }]);

    expect(
      sortRoutes([
        { publicPath: `/` },
        { publicPath: `/*` },
        { publicPath: `/assets/*` },
        { publicPath: `/assets/foo` },
        { publicPath: `/assets/bar/baz/*` },
        { publicPath: `/assets/bar/baz` },
      ]),
    ).toEqual([
      { publicPath: `/` },
      { publicPath: `/assets/bar/baz` },
      { publicPath: `/assets/bar/baz/*` },
      { publicPath: `/assets/foo` },
      { publicPath: `/assets/*` },
      { publicPath: `/*` },
    ]);
  });
});
