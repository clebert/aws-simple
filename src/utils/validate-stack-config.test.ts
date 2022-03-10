import {validateStackConfig} from './validate-stack-config.js';

describe(`validateStackConfig()`, () => {
  test(`valid stack config`, () => {
    expect(() =>
      validateStackConfig({
        routes: [{type: `file`, publicPath: `/foo`, path: `foo`}],
      }),
    ).not.toThrow();

    expect(() =>
      validateStackConfig({
        routes: [
          {type: `file`, publicPath: `/foo`, path: `foo`},
          {type: `file`, publicPath: `/bar`, path: `bar`},
        ],
      }),
    ).not.toThrow();
  });

  test(`invalid stack config`, () => {
    expect(() => validateStackConfig({})).toThrow(
      new Error(
        `The config is invalid. At path: routes -- Expected an array value, but received: undefined`,
      ),
    );

    expect(() => validateStackConfig({routes: []})).toThrow(
      new Error(
        `The config is invalid. At path: routes -- Expected a array with a length between \`1\` and \`9007199254740991\` but received one with a length of \`0\``,
      ),
    );

    expect(() =>
      validateStackConfig({
        domainName: `example.com`,
        routes: [{type: `file`, publicPath: `/foo`, path: `foo`}],
      }),
    ).toThrow(
      new Error(
        `The config is invalid. At path: domainName -- Expected a value of type \`never\`, but received: \`\"example.com\"\``,
      ),
    );
  });
});
