// @ts-check

/**
 * @type {import('./src').StackConfig}
 */
exports.default = {
  appName: 'aws-simple',
  stackId: 'test',
  s3Configs: [
    {
      type: 'file',
      publicPath: '/',
      localPath: 'src/test/index.html',
      bucketPath: 'index.html'
    }
  ]
};
