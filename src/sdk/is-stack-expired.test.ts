import {isStackExpired} from './is-stack-expired';

function createStack(ageInDays: number, tags?: string[]): any {
  const date = new Date();

  date.setDate(date.getDate() - ageInDays);

  return {CreationTime: date, Tags: tags && tags.map(tag => ({Key: tag}))};
}

describe('isStackExpired()', () => {
  it('returns true', () => {
    expect(isStackExpired(createStack(0), 0, [])).toBe(true);
    expect(isStackExpired(createStack(1), 0, [])).toBe(true);
    expect(isStackExpired(createStack(1), 1, [])).toBe(true);
    expect(isStackExpired(createStack(2), 0, [])).toBe(true);
    expect(isStackExpired(createStack(2), 1, [])).toBe(true);
    expect(isStackExpired(createStack(2), 2, [])).toBe(true);

    expect(isStackExpired(createStack(2, ['a']), 2, [])).toBe(true);
    expect(isStackExpired(createStack(2, ['a']), 2, ['b'])).toBe(true);
    expect(isStackExpired(createStack(2, ['a']), 2, ['b', 'c'])).toBe(true);
    expect(isStackExpired(createStack(2, ['a', 'b']), 2, ['c'])).toBe(true);
  });

  it('returns false', () => {
    expect(isStackExpired(createStack(0), 1, [])).toBe(false);
    expect(isStackExpired(createStack(0), 2, [])).toBe(false);
    expect(isStackExpired(createStack(1), 2, [])).toBe(false);

    expect(isStackExpired(createStack(2, ['a']), 2, ['a'])).toBe(false);
    expect(isStackExpired(createStack(2, ['a', 'b']), 2, ['b'])).toBe(false);
    expect(isStackExpired(createStack(2, ['b']), 2, ['a', 'b'])).toBe(false);
  });
});
