export function createExpressPath(publicPath: string): string {
  return publicPath.replace('{proxy+}', '.+');
}
