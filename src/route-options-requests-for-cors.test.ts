import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { Express } from 'express';
import type { Route } from './parse-stack-config.js';
import { routeOptionsRequestsForCors } from './route-options-requests-for-cors.js';

// Mock print utility
jest.mock('./utils/print');

describe('routeOptionsRequestsForCors', () => {
  let app: jest.Mocked<Express>;
  let optionsHandlers: Record<string, Function>;

  beforeEach(() => {
    optionsHandlers = {};
    app = {
      options: jest.fn((path: string, handler: Function) => {
        optionsHandlers[path] = handler;
      }),
    } as any;
    jest.clearAllMocks();
  });

  it('should set up CORS OPTIONS handlers for routes with corsEnabled', () => {
    const routes: Route[] = [
      { publicPath: '/foo', httpMethod: 'GET', corsEnabled: true } as any,
      { publicPath: '/foo', httpMethod: 'POST', corsEnabled: true } as any,
      { publicPath: '/bar', httpMethod: 'PUT', corsEnabled: true } as any,
      { publicPath: '/baz', httpMethod: 'DELETE', corsEnabled: false } as any,
    ];

    routeOptionsRequestsForCors(routes, app);

    expect(app.options).toHaveBeenCalledTimes(2);
    expect(app.options).toHaveBeenCalledWith('/foo', expect.any(Function));
    expect(app.options).toHaveBeenCalledWith('/bar', expect.any(Function));
    expect(optionsHandlers['/foo']).toBeDefined();
    expect(optionsHandlers['/bar']).toBeDefined();
    expect(optionsHandlers['/baz']).toBeUndefined();
  });

  it('should set correct headers and status in the handler', () => {
    const routes: Route[] = [
      { publicPath: '/foo', httpMethod: 'GET', corsEnabled: true } as any,
      { publicPath: '/foo', httpMethod: 'POST', corsEnabled: true } as any,
    ];

    routeOptionsRequestsForCors(routes, app);

    const res = {
      header: jest.fn(),
      sendStatus: jest.fn(),
    };

    if (!optionsHandlers['/foo']) {
      throw new Error('Expected options handler for /foo to be defined');
    }
    optionsHandlers['/foo']({}, res);

    expect(res.header).toHaveBeenCalledWith('Access-Control-Allow-Origin', '*');
    expect(res.header).toHaveBeenCalledWith('Access-Control-Allow-Methods', 'GET, POST');
    expect(res.header).toHaveBeenCalledWith(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization',
    );
    expect(res.sendStatus).toHaveBeenCalledWith(204);
  });

  it('should not set up handler for routes without corsEnabled', () => {
    const routes: Route[] = [
      { publicPath: '/foo', httpMethod: 'GET', corsEnabled: false } as any,
      { publicPath: '/bar', httpMethod: 'POST', corsEnabled: false } as any,
    ];

    routeOptionsRequestsForCors(routes, app);

    expect(app.options).not.toHaveBeenCalled();
    expect(optionsHandlers['/foo']).toBeUndefined();
    expect(optionsHandlers['/bar']).toBeUndefined();
  });

  it('should handle routes with missing httpMethod gracefully', () => {
    const routes: Route[] = [
      { publicPath: '/foo', corsEnabled: true } as any,
      { publicPath: '/bar', httpMethod: 'PUT', corsEnabled: true } as any,
    ];

    routeOptionsRequestsForCors(routes, app);

    expect(app.options).toHaveBeenCalledTimes(1);
    expect(app.options).toHaveBeenCalledWith('/bar', expect.any(Function));
    expect(optionsHandlers['/foo']).toBeUndefined();
    expect(optionsHandlers['/bar']).toBeDefined();
  });
});
