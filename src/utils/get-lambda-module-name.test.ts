import {getLambdaModuleName} from './get-lambda-module-name';

describe('getLambdaModuleName()', () => {
  it('returns the file name without file extension', () => {
    expect(getLambdaModuleName('index.js')).toBe('index');
    expect(getLambdaModuleName('ABCabc.js')).toBe('ABCabc');
  });

  it('checks the file name for valid characters', () => {
    const expectedError = new Error(
      'The Lambda file name (without file extension) must match the following pattern: /^[A-Za-z]+$/'
    );

    expect(() => getLambdaModuleName('.js')).toThrow(expectedError);
    expect(() => getLambdaModuleName('index.bundle.js')).toThrow(expectedError);
    expect(() => getLambdaModuleName('index-bundle.js')).toThrow(expectedError);
  });
});
