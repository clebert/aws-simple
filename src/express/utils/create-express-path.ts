export function createExpressPath(publicPath: string): RegExp {
  return new RegExp(publicPath.replace('{proxy+}', '.+'));
}
