import {Duration} from '@aws-cdk/core';
import {
  LambdaConfig,
  LambdaHttpMethod,
  LambdaLoggingLevel,
  S3Config
} from '../../types';
import {createStageOptions} from './create-stage-options';

function lambda(
  httpMethod: LambdaHttpMethod,
  publicPath: string,
  cacheTtlInSeconds?: number,
  loggingLevel?: LambdaLoggingLevel
): LambdaConfig {
  return {
    httpMethod,
    publicPath,
    localPath: '.',
    cachingEnabled: cacheTtlInSeconds !== undefined,
    cacheTtlInSeconds,
    loggingLevel
  };
}

function file(publicPath: string, cacheTtlInSeconds?: number): S3Config {
  return {
    type: 'file',
    publicPath,
    localPath: '.',
    cachingEnabled: cacheTtlInSeconds !== undefined,
    cacheTtlInSeconds
  };
}

function folder(publicPath: string, cacheTtlInSeconds?: number): S3Config {
  return {
    type: 'folder',
    publicPath,
    localPath: '.',
    cachingEnabled: cacheTtlInSeconds !== undefined,
    cacheTtlInSeconds
  };
}

describe('createStageOptions()', () => {
  it('returns stage options without method options', () => {
    expect(createStageOptions({})).toEqual({
      cacheClusterEnabled: true,
      cachingEnabled: false,
      methodOptions: {}
    });

    expect(createStageOptions({lambdaConfigs: [], s3Configs: []})).toEqual({
      cacheClusterEnabled: true,
      cachingEnabled: false,
      methodOptions: {}
    });
  });

  it('returns stage options with Lambda method options', () => {
    expect(createStageOptions({lambdaConfigs: [lambda('GET', '/')]})).toEqual({
      cacheClusterEnabled: true,
      cachingEnabled: false,
      methodOptions: {'//GET': {cachingEnabled: false}}
    });

    expect(
      createStageOptions({lambdaConfigs: [lambda('GET', '/', 30, 'INFO')]})
    ).toEqual({
      cacheClusterEnabled: true,
      cachingEnabled: false,
      methodOptions: {
        '//GET': {
          cachingEnabled: true,
          cacheTtl: Duration.seconds(30),
          loggingLevel: 'INFO'
        }
      }
    });

    expect(createStageOptions({lambdaConfigs: [lambda('POST', '/')]})).toEqual({
      cacheClusterEnabled: true,
      cachingEnabled: false,
      methodOptions: {'//POST': {cachingEnabled: false}}
    });

    expect(
      createStageOptions({lambdaConfigs: [lambda('GET', '/foo')]})
    ).toEqual({
      cacheClusterEnabled: true,
      cachingEnabled: false,
      methodOptions: {'/foo/GET': {cachingEnabled: false}}
    });

    expect(
      createStageOptions({lambdaConfigs: [lambda('GET', '/bar/')]})
    ).toEqual({
      cacheClusterEnabled: true,
      cachingEnabled: false,
      methodOptions: {'/bar/GET': {cachingEnabled: false}}
    });
  });

  it('returns stage options with S3 method options', () => {
    expect(createStageOptions({s3Configs: [file('/')]})).toEqual({
      cacheClusterEnabled: true,
      cachingEnabled: false,
      methodOptions: {'//GET': {cachingEnabled: false}}
    });

    expect(createStageOptions({s3Configs: [file('/', 30)]})).toEqual({
      cacheClusterEnabled: true,
      cachingEnabled: false,
      methodOptions: {
        '//GET': {cachingEnabled: true, cacheTtl: Duration.seconds(30)}
      }
    });

    expect(createStageOptions({s3Configs: [folder('/')]})).toEqual({
      cacheClusterEnabled: true,
      cachingEnabled: false,
      methodOptions: {'/{file}/GET': {cachingEnabled: false}}
    });

    expect(createStageOptions({s3Configs: [folder('/', 30)]})).toEqual({
      cacheClusterEnabled: true,
      cachingEnabled: false,
      methodOptions: {
        '/{file}/GET': {cachingEnabled: true, cacheTtl: Duration.seconds(30)}
      }
    });

    expect(createStageOptions({s3Configs: [file('/foo')]})).toEqual({
      cacheClusterEnabled: true,
      cachingEnabled: false,
      methodOptions: {'/foo/GET': {cachingEnabled: false}}
    });

    expect(createStageOptions({s3Configs: [folder('/foo')]})).toEqual({
      cacheClusterEnabled: true,
      cachingEnabled: false,
      methodOptions: {'/foo/{file}/GET': {cachingEnabled: false}}
    });

    expect(createStageOptions({s3Configs: [file('/bar/')]})).toEqual({
      cacheClusterEnabled: true,
      cachingEnabled: false,
      methodOptions: {'/bar/GET': {cachingEnabled: false}}
    });

    expect(createStageOptions({s3Configs: [folder('/bar/')]})).toEqual({
      cacheClusterEnabled: true,
      cachingEnabled: false,
      methodOptions: {'/bar/{file}/GET': {cachingEnabled: false}}
    });
  });
});
