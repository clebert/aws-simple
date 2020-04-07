export interface ExpressAppPrivateApi {
  _router?: {
    stack: {
      route?: object;
    }[];
  };
}

export function removeAllRoutes(app: ExpressAppPrivateApi): void {
  if (app._router) {
    app._router.stack = app._router.stack.filter((stack) => !stack.route);
  }
}
