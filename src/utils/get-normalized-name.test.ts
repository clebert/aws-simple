import {getNormalizedName} from './get-normalized-name.js';
import {describe, expect, test} from '@jest/globals';

describe(`getNormalizedName()`, () => {
  test(`returns a normalized name`, () => {
    expect(getNormalizedName(``)).toBe(``);
    expect(getNormalizedName(`foo-bar-123`)).toBe(`foo-bar-123`);
    expect(getNormalizedName(`foo--bar-123`)).toBe(`foo-bar-123`);
    expect(getNormalizedName(`foo__bar_123`)).toBe(`foo-bar-123`);
    expect(getNormalizedName(`foo..bar.123`)).toBe(`foo-bar-123`);
    expect(getNormalizedName(`foo//bar/123`)).toBe(`foo-bar-123`);
    expect(getNormalizedName(`//foo/bar/123/`)).toBe(`foo-bar-123`);
    expect(getNormalizedName(`foo  bar 123`)).toBe(`foo-bar-123`);
    expect(getNormalizedName(`  foo_bar_123  `)).toBe(`foo-bar-123`);
  });
});
