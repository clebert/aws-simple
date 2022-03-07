import express from 'express';
import type {ExpressAppPrivateApi} from './remove-all-routes.js';
import {removeAllRoutes} from './remove-all-routes.js';

describe(`removeAllRoutes()`, () => {
  test(`uses a private Express API, which still behaves as expected`, () => {
    const app: ExpressAppPrivateApi = express();

    expect(app._router).toBeUndefined();

    removeAllRoutes(app);

    expect(app._router).toBeUndefined();

    (app as express.Express).get(`/foo`, jest.fn());
    (app as express.Express).get(`/bar`, jest.fn());

    expect(app._router).toStrictEqual(expect.any(Function));
    expect(app._router!.stack).toStrictEqual(expect.any(Array));
    expect(app._router!.stack).toHaveLength(4);

    const expressQueryLayer = app._router!.stack[0];

    expect(expressQueryLayer).toStrictEqual(expect.any(Object));
    expect(expressQueryLayer!.route).toBeUndefined();

    const expressInitLayer = app._router!.stack[1];

    expect(expressInitLayer).toStrictEqual(expect.any(Object));
    expect(expressInitLayer!.route).toBeUndefined();

    expect(app._router!.stack[2]).toStrictEqual(expect.any(Object));
    expect(app._router!.stack[2]!.route).toStrictEqual(expect.any(Object));

    expect(app._router!.stack[3]).toStrictEqual(expect.any(Object));
    expect(app._router!.stack[3]!.route).toStrictEqual(expect.any(Object));

    removeAllRoutes(app);

    expect(app._router).toStrictEqual(expect.any(Function));
    expect(app._router!.stack).toStrictEqual(expect.any(Array));
    expect(app._router!.stack).toHaveLength(2);
    expect(app._router!.stack[0]).toBe(expressQueryLayer);
    expect(app._router!.stack[1]).toBe(expressInitLayer);
  });
});
