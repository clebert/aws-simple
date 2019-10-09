import {Context} from './context';

describe('Context', () => {
  const context = new Context({
    appName: 'app1',
    stackName: 'foo',
    region: 'unknown'
  });

  it('#parseStackName()', () => {
    expect(context.parseStackName('app1-foo-output-any')).toBe('foo');
    expect(context.parseStackName('app1-foo-resource-any')).toBe('foo');

    expect(context.parseStackName('app1-bar-output-any')).toBe('bar');
    expect(context.parseStackName('app1-bar-resource-any')).toBe('bar');

    expect(context.parseStackName('app2-bar-output-any')).toBe(
      'app2-bar-output-any'
    );

    expect(context.parseStackName('app2-bar-resource-any')).toBe(
      'app2-bar-resource-any'
    );

    expect(context.parseStackName('app1-bar-unknown-any')).toBe(
      'app1-bar-unknown-any'
    );

    expect(context.parseStackName('')).toBe('');
  });
});
