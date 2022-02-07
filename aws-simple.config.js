// @ts-check

/** @type {import('./lib/index').GetStackConfig} */
exports.default = function () {
  return {
    domainName: `example.com`,
    subdomainName: `foo`,
    routes: [
      {type: `file`, publicPath: `/`, path: `dist/index.html`},
      {type: `folder`, publicPath: `/*`, path: `dist`},
    ],
  };
};
