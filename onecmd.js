// @ts-check

const plugins = require('@onecmd/standard-plugins');
const nodeVersion = '16';

/** @type {import('onecmd').Plugin[]} */
module.exports = [
  plugins.babel(),
  plugins.editorconfig(),
  plugins.eslint(),
  plugins.git(),
  plugins.github({branches: ['master'], nodeVersion}),
  plugins.jest({coverage: true}),
  plugins.node(nodeVersion),
  plugins.npm(),
  plugins.prettier(),
  plugins.react(),
  plugins.typescript('node', 'package'),
  plugins.vscode({showFilesInEditor: false}),
  {
    dependencies: [
      {
        type: 'object',
        path: 'jest.config.json',

        generate: (input) => ({
          ...input,
          coveragePathIgnorePatterns: [
            'src/cdk/utils/basic-authorizer-handler/index.ts',
          ],
        }),
      },
    ],
  },
];
