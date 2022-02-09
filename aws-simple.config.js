// @ts-check

/** @type {import('./lib/index').ConfigFileDefaultExport} */
exports.default = function () {
  return {
    hostedZoneName: `example.com`,
    aliasRecordName: `test`,
    routes: [
      {type: `file`, publicPath: `/`, path: `dist/index.html`},
      {type: `folder`, publicPath: `/*`, path: `dist`},
    ],
  };
};
