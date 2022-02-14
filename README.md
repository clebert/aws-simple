# aws-simple

Production-ready AWS website deployment with minimal configuration.

## Installation

```
npm install aws-simple aws-cdk
```

**Warning**: The current version is an entirely new implementation and is
currently not yet tested in production. I will remove this warning as soon as I
have enough experience with the latest version. Until then, I recommend using
the old version for production environments:

```
npm install aws-simple@10.0.3 aws-cdk
```

## Getting started

The following are the steps to deploy a website using `aws-simple` and the AWS
CDK.

### 1. Create a config file

Create a config file named `aws-simple.config.js`, which exports a function that
describes a website stack:

```js
// @ts-check

/** @type {import('aws-simple').ConfigFileDefaultExport} */
exports.default = (port) => {
  return {
    hostedZoneName: `example.com`,
    routes: [{type: `file`, publicPath: `/`, path: `dist/index.html`}],
  };
};
```

The exported function optionally gets a DEV server `port` argument when called
in the context of the `aws-simple start [options]` CLI command.

### 2. Create a public hosted zone on AWS Route 53

Create a **public** hosted zone on AWS Route 53 to make a website available
under a particular domain. The required certificate is created automatically by
`aws-simple` during deployment.

### 3. Create an AWS IAM user

Create an AWS IAM user with programmatic access and an
[AWS IAM policy](#aws-iam-policy-example) with sufficient permissions.

### 4. Set the credentials

Set the credentials of the AWS IAM user using the two environment variables,
`AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. Alternatively, the credentials
are retrieved using the AWS profile.

### 5. Set the AWS region

Set the AWS region using either the environment variable `AWS_REGION` or
`AWS_DEFAULT_REGION` evaluated in the specified order. Alternatively, the region
is retrieved using the AWS profile.

### 6. Bootstrap the AWS environment

```
npx cdk bootstrap --app 'npx aws-simple synthesize'
```

### 7. Deploy a website to AWS

```
npx cdk deploy --app 'npx aws-simple synthesize' && npx aws-simple upload
```

### 8. Optional: Start the local DEV server

```
npx aws-simple start
```

## CLI Help

```
Usage: aws-simple <command> [options]

Commands:
  aws-simple synthesize [options]   Synthesize the configured stack using the CDK.
  aws-simple upload [options]       Upload all referenced files to the S3 bucket of the configured stack.
  aws-simple list [options]         List all deployed stacks filtered by the specified hosted zone name.
  aws-simple delete [options]       Delete the specified stack.
  aws-simple tag [options]          Update the tags of the specified stack.
  aws-simple purge [options]        Delete all expired stacks filtered by the specified hosted zone name.
  aws-simple flush-cache [options]  Flush the REST API cache of the specified stack.
  aws-simple redeploy [options]     Redeploy the REST API of the specified stack.
  aws-simple start [options]        Start a local DEV server.

Options:
      --version  Show version number                                   [boolean]
  -h, --help     Show help                                             [boolean]
```

## Configuration

### Alias record name

```js
exports.default = (port) => {
  return {
    hostedZoneName: `example.com`,
    aliasRecordName: `stage`, // <==
    routes: [{type: `file`, publicPath: `/`, path: `dist/index.html`}],
  };
};
```

An optional alias record name allows multiple website variants to be deployed
and operated simultaneously. Example: `stage.example.com`, `test.example.com`

Except for the specified hosted zone, the website variants do not share any
infrastructure. For the management of multiple website variants, there are the
following two CLI commands:

- `aws-simple list [options]`
- `aws-simple purge [options]`

### S3 file routes

```js
exports.default = (port) => {
  return {
    hostedZoneName: `example.com`,
    routes: [
      {
        type: `file`, // <==
        publicPath: `/`,
        path: `dist/index.html`,

        // Optional property:
        responseHeaders: {'cache-control': `max-age=157680000`},
      },
    ],
  };
};
```

### Lambda function routes

```js
exports.default = (port) => {
  return {
    hostedZoneName: `example.com`,
    routes: [
      {
        type: `function`, // <==
        httpMethod: `GET`,
        publicPath: `/hello`,
        path: `dist/hello.js`,
        functionName: `hello`,

        // Optional properties:
        memorySize: 128,
        timeoutInSeconds: 28,
        environment: {FOO: `bar`},
        requestParameters: {foo: {}, bar: {cacheKey: true, required: true}},
      },
    ],
  };
};
```

```js
// hello.js
exports.handler = async (event) => {
  return {statusCode: 200, body: JSON.stringify({hello: 'world'})};
};
```

### Wildcard file/function routes

```js
exports.default = (port) => {
  return {
    hostedZoneName: `example.com`,
    routes: [
      {
        type: `file`,
        publicPath: `/*`, // <== matches '/', '/foo', '/foo/bar'
        path: `dist/index.html`,
      },
      {
        type: `function`,
        httpMethod: `GET`,
        publicPath: `/hello/*`, // <== matches '/hello', '/hello/world'
        path: `dist/hello.js`,
        functionName: `hello`,
      },
    ],
  };
};
```

### S3 folder routes

```js
exports.default = (port) => {
  return {
    hostedZoneName: `example.com`,
    routes: [
      {
        type: `folder`, // <==
        publicPath: `/*`, // matches '/foo' and '/foo/bar' but not '/'
        path: `dist`,

        // Optional property:
        responseHeaders: {'cache-control': `max-age=157680000`},
      },
    ],
  };
};
```

### Caching

```js
exports.default = (port) => {
  return {
    hostedZoneName: `example.com`,
    cachingEnabled: true, // <==
    routes: [
      {
        type: `file`,
        publicPath: `/`,
        path: `dist/index.html`,
        cacheTtlInSeconds: 300, // <==
      },
      {
        type: `folder`,
        publicPath: `/*`,
        path: `dist`,
        cacheTtlInSeconds: 300, // <==
      },
      {
        type: `function`,
        httpMethod: `GET`,
        publicPath: `/hello`,
        path: `dist/hello.js`,
        functionName: `hello`,
        cacheTtlInSeconds: 300, // <==
      },
    ],
  };
};
```

### Authentication

```js
exports.default = (port) => {
  return {
    hostedZoneName: `example.com`,
    authentication: {
      username: `johndoe`, // <==
      password: `123456`, // <==

      // Optional properties:
      cacheTtlInSeconds: 300,
      realm: `foo`,
    },
    routes: [
      {
        type: `file`,
        publicPath: `/`,
        path: `dist/index.html`,
        authenticationEnabled: true, // <==
      },
      {
        type: `folder`,
        publicPath: `/*`,
        path: `dist`,
        authenticationEnabled: true, // <==
      },
      {
        type: `function`,
        httpMethod: `GET`,
        publicPath: `/hello`,
        path: `dist/hello.js`,
        functionName: `hello`,
        authenticationEnabled: true, // <==
      },
    ],
  };
};
```

### CORS

```js
exports.default = (port) => {
  return {
    hostedZoneName: `example.com`,
    routes: [
      {
        type: `file`,
        publicPath: `/`,
        path: `dist/index.html`,
        corsEnabled: true, // <==
      },
      {
        type: `folder`,
        publicPath: `/*`,
        path: `dist`,
        corsEnabled: true, // <==
      },
      {
        type: `function`,
        httpMethod: `GET`,
        publicPath: `/hello`,
        path: `dist/hello.js`,
        functionName: `hello`,
        corsEnabled: true, // <==
      },
    ],
  };
};
```

```js
// hello.js
exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({hello: 'world'}),
    headers: {
      'access-control-allow-origin': '*', // <==
    },
  };
};
```

### Monitoring

```js
exports.default = (port) => {
  return {
    hostedZoneName: `example.com`,
    monitoring: {
      accessLoggingEnabled: true, // <==
      loggingEnabled: true, // <==
      metricsEnabled: true, // <==
      tracingEnabled: true, // <==
    },
    routes: [{type: `file`, publicPath: `/`, path: `dist/index.html`}],
  };
};
```

### Throttling

```js
// @ts-check

/** @type {import('aws-simple').Throttling} */
const throttling = {rateLimit: 100, burstLimit: 50};

/** @type {import('aws-simple').ConfigFileDefaultExport} */
exports.default = (port) => {
  return {
    hostedZoneName: `example.com`,
    routes: [
      {
        type: `file`,
        publicPath: `/`,
        path: `dist/index.html`,
        throttling, // <==
      },
      {
        type: `folder`,
        publicPath: `/*`,
        path: `dist`,
        throttling, // <==
      },
      {
        type: `function`,
        httpMethod: `GET`,
        publicPath: `/hello`,
        path: `dist/hello.js`,
        functionName: `hello`,
        throttling, // <==
      },
    ],
  };
};
```

### `onSynthesize` hooks

To implement advanced features, `onSynthesize` hooks can be used. Below are two
examples.

#### Example: Configure a firewall

```js
const {aws_wafv2} = require(`aws-cdk-lib`);

exports.default = (port) => {
  return {
    hostedZoneName: `example.com`,
    routes: [{type: `file`, publicPath: `/`, path: `dist/index.html`}],

    onSynthesize: ({stack, restApi}) => {
      const myWebAclArn = `...`;

      const webAclAssociation = new aws_wafv2.CfnWebACLAssociation(
        stack,
        `WebACLAssociation`,
        {
          // https://docs.aws.amazon.com/apigateway/latest/developerguide/arn-format-reference.html
          resourceArn: `arn:aws:apigateway:${stack.region}::/restapis/${restApi.restApiId}/stages/prod`,
          webAclArn: myWebAclArn,
        },
      );

      webAclAssociation.node.addDependency(restApi);
    },
  };
};
```

#### Example: Allow access to a secret in the AWS Secret Manager

```js
const {aws_iam} = require(`aws-cdk-lib`);

exports.default = (port) => {
  return {
    hostedZoneName: `example.com`,
    routes: [
      {
        type: `function`,
        httpMethod: `GET`,
        publicPath: `/hello`,
        path: `dist/hello.js`,
        functionName: `hello`,

        onSynthesize: ({stack, restApi, lambdaFunction}) => {
          const mySecretId = `...`;

          const secretsManagerPolicyStatement = new aws_iam.PolicyStatement({
            effect: aws_iam.Effect.ALLOW,
            actions: [`secretsmanager:GetSecretValue`],
            resources: [
              `arn:aws:secretsmanager:${stack.region}:${stack.account}:secret:${mySecretId}`,
            ],
          });

          lambdaFunction.addToRolePolicy(secretsManagerPolicyStatement);
        },
      },
    ],
  };
};
```

## AWS IAM Policy Example

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Bootstrap0",
      "Effect": "Allow",
      "Action": "cloudformation:*",
      "Resource": "arn:aws:cloudformation:*:*:stack/CDKToolkit/*"
    },
    {
      "Sid": "Bootstrap1",
      "Effect": "Allow",
      "Action": "iam:*",
      "Resource": "arn:aws:iam::*:role/cdk-*"
    },
    {
      "Sid": "Bootstrap2",
      "Effect": "Allow",
      "Action": "ssm:*",
      "Resource": "arn:aws:ssm:*:*:parameter/cdk-bootstrap/*"
    },
    {
      "Sid": "Bootstrap3",
      "Effect": "Allow",
      "Action": "ecr:*",
      "Resource": "arn:aws:ecr:*:*:repository/cdk-*"
    },
    {
      "Sid": "Bootstrap4",
      "Effect": "Allow",
      "Action": "s3:*",
      "Resource": "arn:aws:s3:::cdk-*"
    },
    {
      "Sid": "AwsSimple0",
      "Effect": "Allow",
      "Action": "route53:ListHostedZonesByName",
      "Resource": "*"
    },
    {
      "Sid": "AwsSimple1",
      "Effect": "Allow",
      "Action": "cloudformation:*",
      "Resource": "arn:aws:cloudformation:*:*:stack/aws-simple-*"
    },
    {
      "Sid": "AwsSimple2",
      "Effect": "Allow",
      "Action": "s3:*",
      "Resource": "arn:aws:s3:::aws-simple-*"
    },
    {
      "Sid": "AwsSimple3",
      "Effect": "Allow",
      "Action": "apigateway:POST",
      "Resource": "arn:aws:apigateway:*::/restapis/*/deployments"
    },
    {
      "Sid": "AwsSimple4",
      "Effect": "Allow",
      "Action": "apigateway:PATCH",
      "Resource": "arn:aws:apigateway:*::/restapis/*/stages/prod"
    },
    {
      "Sid": "AwsSimple5",
      "Effect": "Allow",
      "Action": "cloudformation:DescribeStacks",
      "Resource": "*"
    },
    {
      "Sid": "AwsSimple6",
      "Effect": "Allow",
      "Action": "apigateway:DELETE",
      "Resource": "arn:aws:apigateway:*::/restapis/*/stages/prod/cache/data"
    }
  ]
}
```
