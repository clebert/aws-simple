import type {
  APIGatewayAuthorizerResult,
  APIGatewayRequestAuthorizerEvent,
  Handler,
} from 'aws-lambda';

export const handler: Handler<
  APIGatewayRequestAuthorizerEvent,
  APIGatewayAuthorizerResult
  // eslint-disable-next-line @typescript-eslint/require-await
> = async (event) => {
  if (!process.env.USERNAME) {
    throw new Error(`USERNAME is not defined.`);
  }

  const [, partition, service, region, accountId] = event.methodArn.split(`:`);

  return {
    principalId: process.env.USERNAME,
    policyDocument: {
      Version: `2012-10-17`,
      Statement: [
        {
          Action: `execute-api:Invoke`,
          Effect: isAllowed(
            getHeaderValue(event.headers ?? undefined, `authorization`),
          )
            ? `Allow`
            : `Deny`,
          Resource: [`arn`, partition, service, region, accountId, `*`].join(
            `:`,
          ),
        },
      ],
    },
  };
};

function getHeaderValue(
  headers: Record<string, string | undefined> = {},
  headerName: string,
): string | undefined {
  return Object.entries(headers).find(
    ([otherHeaderName]) =>
      otherHeaderName.toLowerCase() === headerName.toLowerCase(),
  )?.[1];
}

function isAllowed(headerValue?: string): boolean {
  if (!headerValue) {
    return false;
  }

  const [username, ...password] = Buffer.from(
    headerValue.slice(`Basic `.length),
    `base64`,
  )
    .toString()
    .split(`:`);

  return (
    username === process.env.USERNAME &&
    password.join(`:`) === process.env.PASSWORD
  );
}
