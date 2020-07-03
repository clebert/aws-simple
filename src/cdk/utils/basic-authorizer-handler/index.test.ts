import {getAuthHeaderValue} from '.';

describe('getAuthHeaderValue()', () => {
  it('returns authorization header value', () => {
    expect(getAuthHeaderValue({authorization: 'Basic 123'})).toBe('Basic 123');
    expect(getAuthHeaderValue({Authorization: 'Basic 456'})).toBe('Basic 456');
    expect(getAuthHeaderValue({AUTHORIZATION: 'Basic 789'})).toBe('Basic 789');
  });

  it('returns undefined', () => {
    expect(getAuthHeaderValue(undefined)).toBeUndefined();
    expect(getAuthHeaderValue({})).toBeUndefined();
    expect(getAuthHeaderValue({auth: 'foo'})).toBeUndefined();
  });
});
