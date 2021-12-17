export interface RouteConfig {
  readonly publicPath: string;
}

export function sortRouteConfigs<TRouteConfig extends RouteConfig>(
  routeConfigs: readonly TRouteConfig[],
): readonly TRouteConfig[] {
  return [...routeConfigs].sort(({publicPath: a}, {publicPath: b}) =>
    a > b ? 1 : -1,
  );
}
