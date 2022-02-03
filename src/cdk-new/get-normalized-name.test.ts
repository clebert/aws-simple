import {getNormalizedName} from './get-normalized-name';

describe(`getNormalizedName()`, () => {
  test(`returns a normalized name`, () => {
    expect(getNormalizedName(``)).toBe(``);
    expect(getNormalizedName(`foo_bar_123`)).toBe(`foo_bar_123`);
    expect(getNormalizedName(`foo__bar_123`)).toBe(`foo_bar_123`);
    expect(getNormalizedName(`foo--bar-123`)).toBe(`foo_bar_123`);
    expect(getNormalizedName(`foo..bar.123`)).toBe(`foo_bar_123`);
    expect(getNormalizedName(`foo//bar/123`)).toBe(`foo_bar_123`);
    expect(getNormalizedName(`foo  bar 123`)).toBe(`foo_bar_123`);
    expect(getNormalizedName(`  foo_bar_123  `)).toBe(`foo_bar_123`);
  });
});
