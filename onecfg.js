// @ts-check

import {
  editorconfig,
  eslint,
  git,
  github,
  javascript,
  jest,
  node,
  npm,
  prettier,
  swc,
  typescript,
  vscode,
} from '@onecfg/standard';
import {onecfg} from 'onecfg';

onecfg(
  ...editorconfig(),
  ...eslint(),
  ...git(),
  ...github({branches: [`master`]}),

  ...javascript({
    target: {ecmaVersion: `es2021`, moduleType: `es2020`, node: true},
  }),

  ...jest(),
  ...node({nodeVersion: `16`}),
  ...npm(),
  ...prettier(),
  ...swc(),

  ...typescript({
    declaration: true,
    outDir: `lib`,
    sourceMap: true,
    lib: [`DOM`],
  }),

  ...vscode({showAllFilesInEditor: false}),
);
