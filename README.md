# aws-simple

Production-ready AWS website deployment with minimal configuration.

## Installation

```
npm install aws-simple aws-cdk
```

## Getting started

The following are the steps to deploy a website using `aws-simple` and the AWS
CDK.

### 1. Create a config file

Create a config file named `aws-simple.config.mjs`, which exports a function
that describes a website stack:

```js
// @ts-check

/** @type {import('aws-simple').ConfigFileDefaultExport} */
export default (port) => ({
  hostedZoneName: 'example.com',
  routes: [{type: 'file', publicPath: '/', path: 'dist/index.html'}],
});
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

### 8. Optional: Start a local DEV server

```
npx aws-simple start
```

## CLI usage

```
Usage: aws-simple <command> [options]

Commands:
  aws-simple synthesize [options]   Synthesize the configured stack using the CDK.
                                                                [aliases: synth]
  aws-simple upload [options]       Upload all referenced files to the S3 bucket of the configured stack.
  aws-simple list [options]         List all deployed stacks filtered by the specified hosted zone name.
  aws-simple delete [options]       Delete the specified stack.
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
export default () => ({
  hostedZoneName: 'example.com',
  aliasRecordName: 'stage', // <==
  routes: [{type: 'file', publicPath: '/', path: 'dist/index.html'}],
});
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
export default () => ({
  hostedZoneName: 'example.com',
  routes: [
    {
      type: 'file', // <==
      publicPath: '/',
      path: 'dist/index.html',

      // optional
      responseHeaders: {'cache-control': 'max-age=157680000'},
    },
  ],
});
```

### Lambda function routes

```js
export default () => ({
  hostedZoneName: 'example.com',
  routes: [
    {
      type: 'function', // <==
      httpMethod: 'GET',
      publicPath: '/hello',
      path: 'dist/hello.js',
      functionName: 'hello', // must be unique per stack and as short as possible

      // optional
      memorySize: 1769, // default: `128` MB
      timeoutInSeconds: 3, // default: `28` seconds (this is the maximum timeout)
      environment: {FOO: 'bar'},
      requestParameters: {foo: {}, bar: {cacheKey: true, required: true}},
    },
  ],
});
```

```js
// dist/hello.js
exports.handler = async () => ({
  statusCode: 200,
  body: JSON.stringify({hello: 'world'}),
});
```

### Wildcard file/function routes

```js
export default () => ({
  hostedZoneName: 'example.com',
  routes: [
    {
      type: 'file',
      publicPath: '/*', // <== matches '/', '/foo', '/foo/bar'
      path: 'dist/index.html',
    },
    {
      type: 'function',
      httpMethod: 'GET',
      publicPath: '/hello/*', // <== matches '/hello', '/hello/world'
      path: 'dist/hello.js',
      functionName: 'hello',
    },
  ],
});
```

### S3 folder routes

```js
export default () => ({
  hostedZoneName: 'example.com',
  routes: [
    {
      type: 'folder', // <==
      publicPath: '/*', // matches '/foo' and '/foo/bar' but not '/'
      path: 'dist',

      // optional
      responseHeaders: {'cache-control': 'max-age=157680000'},
    },
  ],
});
```

### Caching

```js
export default () => ({
  hostedZoneName: 'example.com',
  cachingEnabled: true, // <==
  routes: [
    {
      type: 'file',
      publicPath: '/',
      path: 'dist/index.html',
      cacheTtlInSeconds: 3600, // default: `300` seconds (if caching is enabled)
    },
    {
      type: 'folder',
      publicPath: '/*',
      path: 'dist',
      cacheTtlInSeconds: 3600, // default: `300` seconds (if caching is enabled)
    },
    {
      type: 'function',
      httpMethod: 'GET',
      publicPath: '/hello',
      path: 'dist/hello.js',
      functionName: 'hello',
      cacheTtlInSeconds: 3600, // default: `300` seconds (if caching is enabled)
    },
  ],
});
```

### Authentication

```js
export default () => ({
  hostedZoneName: 'example.com',
  authentication: {
    username: 'johndoe', // <==
    password: '123456', // <==

    // optional
    cacheTtlInSeconds: 3600, // default: `300` seconds (if caching is enabled)
    realm: 'foo',
  },
  routes: [
    {
      type: 'file',
      publicPath: '/',
      path: 'dist/index.html',
      authenticationEnabled: true, // <==
    },
    {
      type: 'folder',
      publicPath: '/*',
      path: 'dist',
      authenticationEnabled: true, // <==
    },
    {
      type: 'function',
      httpMethod: 'GET',
      publicPath: '/hello',
      path: 'dist/hello.js',
      functionName: 'hello',
      authenticationEnabled: true, // <==
    },
  ],
});
```

### CORS

```js
export default () => ({
  hostedZoneName: 'example.com',
  routes: [
    {
      type: 'file',
      publicPath: '/',
      path: 'dist/index.html',
      corsEnabled: true, // <==
    },
    {
      type: 'folder',
      publicPath: '/*',
      path: 'dist',
      corsEnabled: true, // <==
    },
    {
      type: 'function',
      httpMethod: 'GET',
      publicPath: '/hello',
      path: 'dist/hello.js',
      functionName: 'hello',
      corsEnabled: true, // <==
    },
  ],
});
```

```js
// dist/hello.js
exports.handler = async () => ({
  statusCode: 200,
  body: JSON.stringify({hello: 'world'}),
  headers: {
    'access-control-allow-origin': '*', // <==
  },
});
```

### Monitoring

```js
export default () => ({
  hostedZoneName: 'example.com',
  monitoring: {
    accessLoggingEnabled: true, // <==
    loggingEnabled: true, // <==
    metricsEnabled: true, // <==
    tracingEnabled: true, // <==
  },
  routes: [{type: 'file', publicPath: '/', path: 'dist/index.html'}],
});
```

```js
export default () => ({
  hostedZoneName: 'example.com',
  monitoring: true, // <== shorthand form
  routes: [{type: 'file', publicPath: '/', path: 'dist/index.html'}],
});
```

### Throttling

```js
// @ts-check

/** @type {import('aws-simple').Throttling} */
const throttling = {
  rateLimit: 100, // default: `10000` requests per second
  burstLimit: 50, // default: `5000` requests
};

/** @type {import('aws-simple').ConfigFileDefaultExport} */
export default () => ({
  hostedZoneName: 'example.com',
  routes: [
    {
      type: 'file',
      publicPath: '/',
      path: 'dist/index.html',
      throttling, // <==
    },
    {
      type: 'folder',
      publicPath: '/*',
      path: 'dist',
      throttling, // <==
    },
    {
      type: 'function',
      httpMethod: 'GET',
      publicPath: '/hello',
      path: 'dist/hello.js',
      functionName: 'hello',
      throttling, // <==
    },
  ],
});
```

### Tagging

```js
export default () => ({
  hostedZoneName: 'example.com',
  tags: {foo: 'bar', baz: 'qux'}, // <==
  routes: [{type: 'file', publicPath: '/', path: 'dist/index.html'}],
});
```

### Termination protection

```js
export default () => ({
  hostedZoneName: 'example.com',
  terminationProtectionEnabled: true, // <==
  routes: [{type: 'file', publicPath: '/', path: 'dist/index.html'}],
});
```

### Source maps

#### Enabling source maps for a Lambda function on AWS

```js
export default () => ({
  hostedZoneName: 'example.com',
  routes: [
    {
      type: 'function',
      httpMethod: 'GET',
      publicPath: '/hello',
      path: 'dist/hello.js',
      functionName: 'hello',
      environment: {NODE_OPTIONS: '--enable-source-maps'}, // <==
    },
  ],
});
```

#### Enabling source maps for a local DEV Server

```
node --enable-source-maps $(npm bin)/aws-simple start
```

### `onSynthesize` hooks

To implement advanced features, `onSynthesize` hooks can be used. Below are two
examples.

#### Configuring a firewall

```js
import {aws_wafv2} from 'aws-cdk-lib';

export default () => ({
  hostedZoneName: 'example.com',
  routes: [{type: 'file', publicPath: '/', path: 'dist/index.html'}],

  onSynthesize: ({stack, restApi}) => {
    const myWebAclArn = '...';

    new aws_wafv2.CfnWebACLAssociation(stack, 'WebACLAssociation', {
      resourceArn: restApi.deploymentStage.stageArn,
      webAclArn: myWebAclArn,
    });
  },
});
```

#### Allowing a Lambda function read-only access to S3 buckets

```js
import {aws_iam} from 'aws-cdk-lib';

export default () => ({
  hostedZoneName: 'example.com',
  routes: [
    {
      type: 'function',
      httpMethod: 'GET',
      publicPath: '/hello',
      path: 'dist/hello.js',
      functionName: 'hello',

      onSynthesize: ({stack, restApi, lambdaFunction}) => {
        lambdaFunction.role.addManagedPolicy(
          aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
            'AmazonS3ReadOnlyAccess',
          ),
        );
      },
    },
  ],
});
```

#### Allowing a Lambda function to access a secret in the AWS Secret Manager

```js
import {aws_iam} from 'aws-cdk-lib';

export default () => ({
  hostedZoneName: 'example.com',
  routes: [
    {
      type: 'function',
      httpMethod: 'GET',
      publicPath: '/hello',
      path: 'dist/hello.js',
      functionName: 'hello',

      onSynthesize: ({stack, restApi, lambdaFunction}) => {
        const mySecretId = '...';

        const secretsManagerPolicyStatement = new aws_iam.PolicyStatement({
          effect: aws_iam.Effect.ALLOW,
          actions: ['secretsmanager:GetSecretValue'],
          resources: [
            `arn:aws:secretsmanager:${stack.region}:${stack.account}:secret:${mySecretId}`,
          ],
        });

        lambdaFunction.addToRolePolicy(secretsManagerPolicyStatement);
      },
    },
  ],
});
```

### `onStart` hook

The `onStart` hook can be used to customize the DEV server's
[Express app](https://expressjs.com/en/5x/api.html#app), e.g. to configure a
proxy middleware:

```js
import {createProxyMiddleware} from 'http-proxy-middleware';

export default () => ({
  hostedZoneName: 'example.com',
  routes: [{type: 'file', publicPath: '/', path: 'dist/index.html'}],
  onStart: (app) => {
    app.use(
      '/some-external-api',
      createProxyMiddleware({
        target: 'http://www.example.org',
        changeOrigin: true,
      }),
    );
  },
});
```

Note: The `onStart` hook is called before the routes are registered.

## AWS IAM policy example

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
