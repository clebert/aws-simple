// @ts-check

/**
 * @type {import('./src').AppConfig}
 */
exports.default = {
  appName: 'aws-simple',
  defaultStackName: 'test',
  s3Configs: [
    {
      type: 'file',
      publicPath: '/',
      localPath: 'src/test/index.html',
      bucketPath: 'index.html'
    }
  ]
};
