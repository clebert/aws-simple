import {getFunctionName} from './get-function-name';

describe(`getFunctionName()`, () => {
  it(`generates a unique function name`, () => {
    expect(getFunctionName(`example.com`, `/`)).toBe(`example_com-9a06d5b`);

    expect(getFunctionName(`example.com`, `/foo/bar`)).toBe(
      `example_com-foo_bar-747bc1b`,
    );

    expect(getFunctionName(`test.example.com`, `/foo/bar`)).toBe(
      `test_example_com-foo_bar-747bc1b`,
    );
  });

  it(`generates a function name with a max length of 64 characters`, () => {
    const domainName = `test.example.com`;
    let pathname = ``;

    for (let i = 0; i < 17; pathname += `/${i++}`) {}

    const functionName = getFunctionName(domainName, pathname);
    const hash = `e7f243b`;

    expect(pathname).toHaveLength(41);
    expect(`${domainName}-${pathname}-${hash}`).toHaveLength(66);
    expect(functionName).toHaveLength(64);

    expect(functionName).toBe(
      `test_example_com-0_1_2_3_4_5_6_7_8_9_10_11_12_13_14_15_1-${hash}`,
    );
  });
});
