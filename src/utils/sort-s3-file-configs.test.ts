import {sortS3FileConfigs} from './sort-s3-file-configs';

describe('sortS3FileConfigs()', () => {
  it('sorts by specificity', () => {
    expect(sortS3FileConfigs(Object.freeze([]))).toEqual([]);

    expect(
      sortS3FileConfigs(
        Object.freeze([
          {type: 'file', publicPath: '/', localPath: '...'},
          {type: 'file', publicPath: '/{proxy+}', localPath: '...'},
          {type: 'file', publicPath: '/assets/{proxy+}', localPath: '...'},
          {type: 'file', publicPath: '/assets/foo', localPath: '...'},
          {type: 'file', publicPath: '/assets/bar/baz', localPath: '...'},
          {
            type: 'file',
            publicPath: '/assets/bar/baz/{proxy+}',
            localPath: '...',
          },
        ])
      )
    ).toEqual([
      {type: 'file', publicPath: '/', localPath: '...'},
      {type: 'file', publicPath: '/assets/bar/baz', localPath: '...'},
      {
        type: 'file',
        publicPath: '/assets/bar/baz/{proxy+}',
        localPath: '...',
      },
      {type: 'file', publicPath: '/assets/foo', localPath: '...'},
      {type: 'file', publicPath: '/assets/{proxy+}', localPath: '...'},
      {type: 'file', publicPath: '/{proxy+}', localPath: '...'},
    ]);
  });
});
