export interface StackNameParts {
  readonly appName: string;
  readonly appVersion: string;
}

function assertPart(value: string, valueName: string): void {
  if (
    !value ||
    value.startsWith(`-`) ||
    value.endsWith(`-`) ||
    value.includes(`--`) ||
    /[^A-Za-z0-9-]/.test(value)
  ) {
    throw new Error(
      `The specified ${valueName} is invalid. It can only include letters (A-Z and a-z), numbers (0-9), and single hyphens (-).`,
    );
  }
}

export function createStackName(parts: StackNameParts): string {
  const {appName, appVersion} = parts;

  assertPart(appName, `app name`);
  assertPart(appVersion, `app version`);

  return `aws-simple--${appName}--${appVersion}`;
}

export function parseStackName(stackName: string): StackNameParts | undefined {
  const result = /^aws-simple--(.*)--(.*)$/.exec(stackName);

  return result ? {appName: result[1]!, appVersion: result[2]!} : undefined;
}
