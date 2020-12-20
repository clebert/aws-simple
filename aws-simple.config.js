// @ts-check

/**
 * @type {import('./src/types').App}
 */
exports.default = {
  appName: 'aws-simple',
  appVersion: 'test',
  routes: () => ({
    '/': {kind: 'file', filename: 'src/test/index.html'},
  }),
};
