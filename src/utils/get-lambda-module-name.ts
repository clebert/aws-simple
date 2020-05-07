import * as path from 'path';

export function getLambdaModuleName(localPath: string): string {
  const lambdaModuleName = path.basename(localPath, path.extname(localPath));
  const regExp = /^[A-Za-z0-9-_]+$/;

  if (!regExp.test(lambdaModuleName)) {
    throw new Error(
      `The Lambda file name (without file extension) must match the following pattern: ${regExp}`
    );
  }

  return lambdaModuleName;
}
