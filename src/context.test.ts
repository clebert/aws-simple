import {Context} from './context';

describe('Context', () => {
  const context = new Context({appName: 'app1', defaultStackName: 'foo'});

  describe('#parseStackName()', () => {
    it('returns the parsed stack name', () => {
      expect(context.parseStackName('app1-foo-output-any')).toBe('foo');
      expect(context.parseStackName('app1-foo-resource-any')).toBe('foo');

      expect(context.parseStackName('app1-bar-output-any')).toBe('bar');
      expect(context.parseStackName('app1-bar-resource-any')).toBe('bar');
    });

    it('throws an error', () => {
      expect(() => context.parseStackName('app2-bar-output-any')).toThrowError(
        'Unable to parse stack name from ID: app2-bar-output-any'
      );

      expect(() =>
        context.parseStackName('app2-bar-resource-any')
      ).toThrowError(
        'Unable to parse stack name from ID: app2-bar-resource-any'
      );

      expect(() => context.parseStackName('app1-bar-unknown-any')).toThrowError(
        'Unable to parse stack name from ID: app1-bar-unknown-any'
      );

      expect(() => context.parseStackName('')).toThrowError(
        'Unable to parse stack name from ID: '
      );
    });
  });
});
