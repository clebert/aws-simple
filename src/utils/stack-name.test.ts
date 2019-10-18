import {createStackName, parseStackName} from './stack-name';

const validPart =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ-abcdefghijklmnopqrstuvwxyz-0123456789';

describe('createStackName', () => {
  it('returns the created stack name', () => {
    expect(createStackName({appName: validPart, appVersion: validPart})).toBe(
      `aws-simple--${validPart}--${validPart}`
    );

    expect(createStackName({appName: 'foo', appVersion: 'bar'})).toBe(
      `aws-simple--foo--bar`
    );

    expect(createStackName({appName: 'f-o-o', appVersion: 'b-a-r'})).toBe(
      `aws-simple--f-o-o--b-a-r`
    );
  });

  it('throws an error', () => {
    for (const invalidParts of [
      {appName: '', appVersion: 'bar'},
      {appName: ' ', appVersion: 'bar'},
      {appName: '-foo', appVersion: 'bar'},
      {appName: 'foo-', appVersion: 'bar'},
      {appName: 'f--o--o', appVersion: 'bar'},
      {appName: 'f.o.o', appVersion: 'bar'}
    ]) {
      expect(() => createStackName(invalidParts)).toThrowError(
        'The specified app name is invalid. It can only include letters (A-Z and a-z), numbers (0-9), and single hyphens (-).'
      );
    }

    for (const invalidParts of [
      {appName: 'foo', appVersion: ''},
      {appName: 'foo', appVersion: ' '},
      {appName: 'foo', appVersion: '-bar'},
      {appName: 'foo', appVersion: 'bar-'},
      {appName: 'foo', appVersion: 'b--a--r'},
      {appName: 'foo', appVersion: 'b.a.r'}
    ]) {
      expect(() => createStackName(invalidParts)).toThrowError(
        'The specified app version is invalid. It can only include letters (A-Z and a-z), numbers (0-9), and single hyphens (-).'
      );
    }
  });
});

describe('parseStackName', () => {
  it('returns the parsed stack name', () => {
    for (const parts of [
      {appName: validPart, appVersion: validPart},
      {appName: 'foo', appVersion: 'bar'},
      {appName: 'f-o-o', appVersion: 'b-a-r'}
    ]) {
      expect(parseStackName(createStackName(parts))).toEqual(parts);
    }
  });

  it('returns undefined', () => {
    expect(parseStackName('')).toBeUndefined();
    expect(parseStackName('unknown')).toBeUndefined();
  });
});
