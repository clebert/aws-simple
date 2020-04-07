import express from 'express';
import {ExpressAppPrivateApi, removeAllRoutes} from './remove-all-routes';

describe('removeAllRoutes()', () => {
  it('uses a private Express API, which still behaves as expected', () => {
    const app: ExpressAppPrivateApi = express();

    expect(app._router).toBeUndefined();

    removeAllRoutes(app);

    expect(app._router).toBeUndefined();

    (app as express.Express).get('/foo', jest.fn());
    (app as express.Express).get('/bar', jest.fn());

    expect(app._router).toStrictEqual(expect.any(Function));
    expect(app._router!.stack).toStrictEqual(expect.any(Array));
    expect(app._router!.stack).toHaveLength(4);

    const stack0 = app._router!.stack[0];

    expect(stack0).toStrictEqual(expect.any(Object));
    expect(stack0!.route).toBeUndefined();

    const stack1 = app._router!.stack[1];

    expect(stack1).toStrictEqual(expect.any(Object));
    expect(stack1!.route).toBeUndefined();

    expect(app._router!.stack[2]).toStrictEqual(expect.any(Object));
    expect(app._router!.stack[2].route).toStrictEqual(expect.any(Object));

    expect(app._router!.stack[3]).toStrictEqual(expect.any(Object));
    expect(app._router!.stack[3].route).toStrictEqual(expect.any(Object));

    removeAllRoutes(app);

    expect(app._router).toStrictEqual(expect.any(Function));
    expect(app._router!.stack).toStrictEqual(expect.any(Array));
    expect(app._router!.stack).toHaveLength(2);
    expect(app._router!.stack[0]).toBe(stack0);
    expect(app._router!.stack[1]).toBe(stack1);
  });
});
