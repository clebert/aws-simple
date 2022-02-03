// @ts-check

/** @type {import('./lib/index').GetStackConfig} */
exports.default = function () {
  return {
    hostedZoneName: `example.com`,
    routes: [{type: `file+`, publicPath: `/`, filename: `index.html`}],
  };
};
