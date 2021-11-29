// @ts-check

const std = require('@onecmd/standard-plugins');
const nodeVersion = '16';

/** @type {readonly import('onecmd').Plugin[]} */
const plugins = [
  std.editorconfig(),
  std.eslint(),
  std.git(),
  std.github({branches: ['master'], nodeVersion}),
  std.jest({coverage: true}),
  std.node(nodeVersion),
  std.npm(),
  std.prettier(),
  std.react(),
  std.swc(),
  std.typescript('node', 'package'),
  std.vscode({showFilesInEditor: false}),

  {
    setup: () => [
      {
        type: 'mod',
        path: 'jest.config.json',
        is: std.isObject,

        update: (input) => ({
          ...input,
          coveragePathIgnorePatterns: [
            'src/cdk/utils/basic-authorizer-handler/index.ts',
          ],
        }),
      },
    ],
  },
];

module.exports = plugins;
