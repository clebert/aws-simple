import {CustomAuthorizerHandler, CustomAuthorizerResult} from 'aws-lambda';

function isValidBasicAuthHeader(headerValue?: string): boolean {
  if (!headerValue) {
    return false;
  }

  // Strip 'Basic ' from the front to get the raw value:
  const encoded = headerValue.substr('Basic '.length);

  const [username, ...password] = Buffer.from(encoded, 'base64')
    .toString()
    .split(':');

  return (
    username === process.env.USERNAME &&
    password.join(':') === process.env.PASSWORD
  );
}

function createAllowPolicy(
  principalId: string,
  resource: string
): CustomAuthorizerResult {
  const [arn, partition, service, region, accountId] = resource.split(':');

  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: [arn, partition, service, region, accountId, '*'].join(':'),
        },
      ],
    },
  };
}

function getHeaderValue(
  headers: Record<string, string> = {},
  name: string
): string | undefined {
  const searchedHeaderName = name.toLowerCase();
  return Object.entries(headers).find(
    ([headerName]) => headerName.toLowerCase() === searchedHeaderName
  )?.[1];
}

export function getAuthHeaderValue(
  headers: Record<string, string> = {}
): string | undefined {
  return getHeaderValue(headers, 'authorization');
}

export const handler: CustomAuthorizerHandler = (event, _context, callback) => {
  if (!process.env.USERNAME) {
    callback(new Error('USERNAME is not defined.'));
  } else if (isValidBasicAuthHeader(getAuthHeaderValue(event.headers))) {
    callback(null, createAllowPolicy(process.env.USERNAME, event.methodArn));
  } else {
    callback('Unauthorized');
  }
};
