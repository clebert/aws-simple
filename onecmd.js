// @ts-check

const std = require(`@onecmd/standard-plugins`);
const nodeVersion = `16`;

/** @type {readonly import('onecmd').Plugin[]} */
const plugins = [
  std.editorconfig(),
  std.eslint(),
  std.git(),
  std.github({branches: [`master`], nodeVersion}),
  std.jest({coverage: true}),
  std.node(nodeVersion),
  std.npm(),
  std.prettier(),
  std.swc(),
  std.typescript(`node`, `bundle`),
  std.vscode({showFilesInEditor: false}),
  {
    setup: () => [
      std.typescript.configFile.merge(() => ({
        compilerOptions: {module: `commonjs`, outDir: `lib`},
      })),
      {type: `ref`, path: `lib`},
      {type: `ref`, path: `tsconfig.tsbuildinfo`},
    ],
  },
];

module.exports = plugins;
