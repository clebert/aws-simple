import {StackNameParts, createStackName, parseStackName} from './stack-name';

describe('createStackName', () => {
  it('returns the created stack name', () => {
    const validPart =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    expect(createStackName({appName: validPart, appVersion: validPart})).toBe(
      `aws-simple--${validPart}--${validPart}`
    );
  });

  it('throws an error', () => {
    for (const invalidParts of [
      {appName: '', appVersion: 'bar'},
      {appName: ' ', appVersion: 'bar'},
      {appName: 'f-o-o', appVersion: 'bar'},
      {appName: 'f_o_o', appVersion: 'bar'},
      {appName: 'f.o.o', appVersion: 'bar'}
    ]) {
      expect(() => createStackName(invalidParts)).toThrowError(
        'The specified app name is invalid.'
      );
    }

    for (const invalidParts of [
      {appName: 'foo', appVersion: ''},
      {appName: 'foo', appVersion: ' '},
      {appName: 'foo', appVersion: 'b-a-r'},
      {appName: 'foo', appVersion: 'b_a_r'},
      {appName: 'foo', appVersion: 'b.a.r'}
    ]) {
      expect(() => createStackName(invalidParts)).toThrowError(
        'The specified app version is invalid.'
      );
    }
  });
});

describe('parseStackName', () => {
  it('returns the parsed stack name', () => {
    const parts: StackNameParts = {appName: 'foo', appVersion: 'bar'};

    expect(parseStackName(createStackName(parts))).toEqual(parts);
  });

  it('returns undefined', () => {
    expect(parseStackName('')).toBeUndefined();
    expect(parseStackName('unknown')).toBeUndefined();
  });
});
