import {APIGatewayProxyEvent} from 'aws-lambda';
import express from 'express';

export function getRequestHeaders(
  req: express.Request
): Pick<APIGatewayProxyEvent, 'headers' | 'multiValueHeaders'> {
  const headers: Record<string, string> = {};
  const multiValueHeaders: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      multiValueHeaders[key] = value;
    } else if (typeof value === 'string') {
      headers[key] = value;
    }
  }

  return {headers, multiValueHeaders};
}
