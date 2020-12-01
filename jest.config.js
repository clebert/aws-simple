module.exports = {
  collectCoverage: true,
  coverageThreshold: {
    global: {branches: 100, functions: 100, lines: 100, statements: 100},
  },
  coveragePathIgnorePatterns: [
    'src/cdk/utils/basic-authorizer-handler/index.ts',
  ],
  restoreMocks: true,
  silent: true,
  testMatch: ['**/src/**/*.test.ts', '**/src/**/*.test.tsx'],
  verbose: true,
};
