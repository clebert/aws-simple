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
        compilerOptions: {
          lib: [`dom`],
          module: `commonjs`,
          outDir: `lib`,
          declaration: true,
        },
      })),
      {type: `ref`, path: `lib`},
      {type: `ref`, path: `tsconfig.tsbuildinfo`},
      {type: `ref`, path: `.envrc`, attrs: {visible: true}},
      {type: `ref`, path: `.swc`},
      {type: `ref`, path: `cdk.out`},
      {type: `ref`, path: `cdk.context.json`},
    ],
  },
];

module.exports = plugins;
