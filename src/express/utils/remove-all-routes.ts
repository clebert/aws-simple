import express from 'express';

export function removeAllRoutes(app: express.Express): void {
  app._router.stack = app._router.stack.filter(
    (stack: {readonly route?: object}) => !stack.route
  );
}
