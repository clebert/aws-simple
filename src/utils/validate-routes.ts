import type {Route} from '../read-stack-config.js';

import {getNormalizedName} from './get-normalized-name.js';

export function validateRoutes(routes: readonly Route[]): void {
  const existingHttpMethodPublicPaths = new Set<string>();
  const existingFunctionNames = new Set<string>();

  for (const route of routes) {
    const publicPaths =
      route.type === `folder`
        ? [route.publicPath]
        : route.publicPath.endsWith(`/*`)
        ? [route.publicPath, route.publicPath.replace(`/*`, ``) || `/`]
        : [route.publicPath];

    const httpMethod = route.type === `function` ? route.httpMethod : `GET`;

    for (const publicPath of publicPaths) {
      const httpMethodPublicPath = `${httpMethod} ${publicPath}`;

      if (existingHttpMethodPublicPaths.has(httpMethodPublicPath)) {
        throw new Error(
          `A public path must be unique per HTTP method: ${httpMethodPublicPath}`,
        );
      }

      existingHttpMethodPublicPaths.add(httpMethodPublicPath);

      if (publicPath !== `/` && publicPath.endsWith(`/`)) {
        throw new Error(
          `A public path other than root must not end with a slash: ${publicPath}`,
        );
      }

      if (/\/\*.+/.test(publicPath)) {
        throw new Error(
          `A public path may contain a wildcard only at the end: ${publicPath}`,
        );
      }

      if (route.type === `folder` && !publicPath.endsWith(`/*`)) {
        throw new Error(
          `A public path of an S3 folder route must end with a wildcard: ${publicPath}`,
        );
      }
    }

    if (route.type === `function`) {
      const functionName = getNormalizedName(route.functionName);

      if (existingFunctionNames.has(functionName)) {
        throw new Error(
          `A normalized function name must be unique: ${functionName}`,
        );
      }

      existingFunctionNames.add(functionName);
    }
  }
}
