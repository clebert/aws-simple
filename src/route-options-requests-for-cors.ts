import type { Express } from 'express';
import type { Route } from './parse-stack-config.js';
import { print } from './utils/print.js';

export function routeOptionsRequestsForCors(routes: readonly Route[], app: Express) {
  const corsEnabledMethodsByRoute = routes.reduce((corsEnabledMethodsByRoute, route) => {
    if (route.corsEnabled && route.httpMethod) {
      print.info(`CORS is enabled for route: ${route.publicPath} with method: ${route.httpMethod}`);

      const existingMethods = corsEnabledMethodsByRoute.get(route.publicPath);
      if (existingMethods) {
        existingMethods.push(route.httpMethod);
      } else {
        corsEnabledMethodsByRoute.set(route.publicPath, [route.httpMethod]);
      }
    }
    return corsEnabledMethodsByRoute;
  }, new Map<string, string[]>());
  corsEnabledMethodsByRoute.forEach((methods, path) => {
    print.info(`Setting up CORS for path: ${path} with methods: ${methods.join(`, `)}`);

    app.options(path, (_req, res) => {
      res.header(`Access-Control-Allow-Origin`, `*`);
      res.header(`Access-Control-Allow-Methods`, methods.join(`, `));
      res.header(`Access-Control-Allow-Headers`, `Content-Type, Authorization`);
      res.sendStatus(204);
    });
  });
}
