import type {Route} from '../parse-stack-config.js';

export function sortRoutes<TRoute extends Pick<Route, 'publicPath'>>(
  routes: readonly TRoute[],
): readonly TRoute[] {
  return [...routes].sort(({publicPath: a}, {publicPath: b}) =>
    a.replace(`/*`, `/~`) > b.replace(`/*`, `/~`) ? 1 : -1,
  );
}
