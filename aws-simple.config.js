// @ts-check

/**
 * @type {import('./src').AppConfig}
 */
exports.default = {
  appName: 'aws-simple',
  stackName: 'test',
  stackConfig: {
    s3Configs: [
      {
        type: 'file',
        publicPath: '/',
        localPath: 'src/test/index.html',
        bucketPath: 'index.html'
      }
    ]
  }
};
