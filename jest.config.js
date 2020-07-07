module.exports = {
  silent: true,
  verbose: true,
  clearMocks: true,
  collectCoverage: true,
  coverageThreshold: {
    global: {branches: 100, functions: 100, lines: 100, statements: 100},
  },
  coveragePathIgnorePatterns: [
    'src/cdk/utils/basic-authorizer-handler/index.ts',
  ],
  testMatch: ['**/src/**/*.test.ts'],
};
