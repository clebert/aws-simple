import type {Route} from '../read-stack-config';
import {getNormalizedName} from './get-normalized-name';

export function validateRoutes(routes: readonly Route[]): void {
  const publicPaths = new Set<string>();
  const functionNames = new Set<string>();

  for (const route of routes) {
    const {type, publicPath} = route;

    if (publicPaths.has(publicPath)) {
      throw new Error(`A public path must be unique: ${publicPath}`);
    }

    if (publicPath !== `/` && publicPath.endsWith(`/`)) {
      throw new Error(
        `A public path other than root must not end with a slash: ${publicPath}`,
      );
    }

    publicPaths.add(publicPath);

    if (/\/\*.+/.test(publicPath)) {
      throw new Error(
        `A public path may contain a wildcard only at the end: ${publicPath}`,
      );
    }

    if (type === `function`) {
      const functionName = getNormalizedName(route.functionName);

      if (functionNames.has(functionName)) {
        throw new Error(
          `A normalized function name must be unique: ${functionName}`,
        );
      }

      functionNames.add(functionName);
    } else if (type === `folder` && !publicPath.endsWith(`/*`)) {
      throw new Error(
        `A public path of an S3 folder route must end with a wildcard: ${publicPath}`,
      );
    }
  }
}
