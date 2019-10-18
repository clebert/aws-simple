// @ts-check

/**
 * @type {import('./src/types').AppConfig}
 */
exports.default = {
  appName: 'aws-simple',
  appVersion: 'test',
  createStackConfig: () => ({
    s3Configs: [
      {
        type: 'file',
        publicPath: '/',
        localPath: 'src/test/index.html',
        bucketPath: 'index.html'
      }
    ]
  })
};
