import type { APIGatewayProxyEvent } from 'aws-lambda';
import type { Request } from 'express';

export function getRequestHeaders(
  req: Request,
): Pick<APIGatewayProxyEvent, 'headers' | 'multiValueHeaders'> {
  const headers: Record<string, string> = {};
  const multiValueHeaders: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      const values = [value].flat();

      headers[key] = values[values.length - 1]!;
      multiValueHeaders[key] = values;
    }
  }

  return { headers, multiValueHeaders };
}
