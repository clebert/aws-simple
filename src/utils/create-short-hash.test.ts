import {createShortHash} from './create-short-hash';

describe('createShortHash()', () => {
  it('has a length of 8', () => {
    expect(createShortHash()).toHaveLength(8);
    expect(createShortHash('foo')).toHaveLength(8);
    expect(createShortHash('foo', 'bar')).toHaveLength(8);
  });

  it('is always the same for same inputs', () => {
    expect(createShortHash()).toBe(createShortHash());
    expect(createShortHash('foo')).toBe(createShortHash('foo'));
  });

  it('is always different for different inputs', () => {
    expect(createShortHash()).not.toBe(createShortHash('foo'));
    expect(createShortHash('foo')).not.toBe(createShortHash('foo', 'bar'));
  });

  it('starts with the prefix "R"', () => {
    // because logical IDs must adhere to the regular expression:
    // /^[A-Za-z][A-Za-z0-9]{1,254}$/

    expect(createShortHash()).toMatch(/^R/);
    expect(createShortHash('foo')).toMatch(/^R/);
    expect(createShortHash('foo', 'bar')).toMatch(/^R/);
  });
});
