import type {APIGatewayProxyEvent} from 'aws-lambda';
import type {Request} from 'express';

export function getQueryStringParameters(
  req: Request,
): Pick<APIGatewayProxyEvent, 'queryStringParameters' | 'multiValueQueryStringParameters'> {
  const queryStringParameters: Record<string, string> = {};
  const multiValueQueryStringParameters: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(req.query)) {
    const values = [value].flat();

    if (isStringArray(values)) {
      queryStringParameters[key] = values[values.length - 1]!;
      multiValueQueryStringParameters[key] = values;
    }
  }

  return {queryStringParameters, multiValueQueryStringParameters};
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((element) => typeof element === `string`);
}
