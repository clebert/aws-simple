import type {APIGatewayProxyEvent} from 'aws-lambda';
import type express from 'express';

export function getRequestHeaders(
  req: express.Request,
): Pick<APIGatewayProxyEvent, 'headers' | 'multiValueHeaders'> {
  const headers: Record<string, string> = {};
  const multiValueHeaders: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      const values = [value].flat();
      multiValueHeaders[key] = values;
      headers[key] = values[values.length - 1]!;
    }
  }

  return {headers, multiValueHeaders};
}
