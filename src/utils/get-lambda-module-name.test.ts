import {getLambdaModuleName} from './get-lambda-module-name';

describe(`getLambdaModuleName()`, () => {
  it(`returns the file name without file extension`, () => {
    expect(getLambdaModuleName(`index.js`)).toBe(`index`);
    expect(getLambdaModuleName(`foo/index.js`)).toBe(`index`);
    expect(getLambdaModuleName(`ABCabc.js`)).toBe(`ABCabc`);
    expect(getLambdaModuleName(`ABC012.js`)).toBe(`ABC012`);
    expect(getLambdaModuleName(`abc-abc.js`)).toBe(`abc-abc`);
    expect(getLambdaModuleName(`abc_abc.js`)).toBe(`abc_abc`);
  });

  it(`checks the file name for valid characters`, () => {
    const expectedError = new Error(
      `The Lambda file name (without file extension) must match the following pattern: /^[A-Za-z0-9-_]+$/`,
    );

    expect(() => getLambdaModuleName(`.js`)).toThrow(expectedError);
    expect(() => getLambdaModuleName(`foo/.js`)).toThrow(expectedError);
    expect(() => getLambdaModuleName(`index.bundle.js`)).toThrow(expectedError);
  });
});
