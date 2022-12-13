import {
  editorconfig,
  eslint,
  git,
  github,
  jest,
  node,
  npm,
  prettier,
  swc,
  typescript,
  vscode,
} from '@onecfg/standard';
import {mergeContent, writeFiles} from 'onecfg';

const target = `es2022`;

writeFiles(
  ...editorconfig(),
  ...eslint(),
  ...git(),

  ...github({
    branches: [`master`],
    additionalCiScripts: [`compile:emit:request-authorizer`],
  }),

  ...jest(),
  ...node({nodeVersion: `16`}),
  ...npm(),
  ...prettier(),
  ...swc({target}),
  ...typescript({target, emit: true}),
  ...typescript.mergeCompilerOptions({noErrorTruncation: true}),
  ...vscode({includeFilesInExplorer: false}),

  mergeContent(npm.packageFile, {
    scripts: {
      'postcompile:emit': `chmod +x lib/index.js`,
      'compile:emit:request-authorizer': `tsc --pretty --project src/cdk/request-authorizer`,
      'start': `node ./lib/index.js`,
    },
  }),

  mergeContent(typescript.emitConfigFile, {
    exclude: [`src/cdk/request-authorizer/*`],
  }),

  mergeContent(eslint.configFile, {
    overrides: [
      {
        files: [`src/cdk/request-authorizer/*`],
        parserOptions: {project: `src/cdk/request-authorizer/tsconfig.json`},
      },
      {
        files: [`**/*.md/*.js`],
        rules: {'import/no-commonjs': `off`},
      },
    ],
  }),
);
