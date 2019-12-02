import {createShortHash} from './create-short-hash';

describe('createShortHash()', () => {
  it('has a length of 7', () => {
    expect(createShortHash()).toHaveLength(7);
    expect(createShortHash('foo')).toHaveLength(7);
    expect(createShortHash('foo', 'bar')).toHaveLength(7);
  });

  it('is always the same for same inputs', () => {
    expect(createShortHash()).toBe(createShortHash());
    expect(createShortHash('foo')).toBe(createShortHash('foo'));
  });

  it('is always different for different inputs', () => {
    expect(createShortHash()).not.toBe(createShortHash('foo'));
    expect(createShortHash('foo')).not.toBe(createShortHash('foo', 'bar'));
  });
});
