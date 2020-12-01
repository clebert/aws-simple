module.exports = {
  presets: [
    ['@babel/env', {targets: {node: '15'}}],
    '@babel/typescript',
    '@babel/react',
  ],
  plugins: [
    '@babel/proposal-class-properties',
    '@babel/proposal-nullish-coalescing-operator',
    '@babel/proposal-optional-chaining',
  ],
};
