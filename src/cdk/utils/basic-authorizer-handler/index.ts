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
    username === process.env['USERNAME'] &&
    password.join(':') === process.env['PASSWORD']
  );
}

function createAllowPolicy(
  principalId: string,
  resource: string
): CustomAuthorizerResult {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource:
            resource
              .split(':')
              .slice(0, -1)
              .join(':') + ':*'
        }
      ]
    }
  };
}

export const handler: CustomAuthorizerHandler = (event, _context, callback) => {
  if (!process.env['USERNAME']) {
    callback(new Error('USERNAME is not defined.'));
  } else if (isValidBasicAuthHeader(event.headers?.authorization)) {
    callback(null, createAllowPolicy(process.env['USERNAME'], event.methodArn));
  } else {
    callback('Unauthorized');
  }
};
