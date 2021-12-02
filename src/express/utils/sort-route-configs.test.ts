import {sortRouteConfigs} from './sort-route-configs';

describe(`sortRouteConfigs()`, () => {
  it(`sorts by specificity`, () => {
    expect(sortRouteConfigs(Object.freeze([]))).toEqual([]);

    expect(
      sortRouteConfigs(
        Object.freeze([
          {publicPath: `/`},
          {publicPath: `/{proxy+}`},
          {publicPath: `/assets/{proxy+}`},
          {publicPath: `/assets/foo`},
          {publicPath: `/assets/bar/baz`},
          {publicPath: `/assets/bar/baz/{proxy+}`},
        ])
      )
    ).toEqual([
      {publicPath: `/`},
      {publicPath: `/assets/bar/baz`},
      {publicPath: `/assets/bar/baz/{proxy+}`},
      {publicPath: `/assets/foo`},
      {publicPath: `/assets/{proxy+}`},
      {publicPath: `/{proxy+}`},
    ]);
  });
});
