# aws-simple

![](https://github.com/clebert/aws-simple/workflows/CI/badge.svg)

A Node.js interface for **AWS** that allows easy configuration and deployment of
**simple** web apps.

## Contents

- [Quick Overview](https://github.com/clebert/aws-simple#quick-overview)
- [Motivation](https://github.com/clebert/aws-simple#motivation)
- [Getting Started](https://github.com/clebert/aws-simple#getting-started)
- [Configuration](https://github.com/clebert/aws-simple#configuration)
- [CLI Usage](https://github.com/clebert/aws-simple#cli-usage)
- [Development](https://github.com/clebert/aws-simple#development)

## Quick Overview

`aws-simple` allows you to easily create and deploy an API Gateway with a custom
domain and optional alias record, host static web resources via S3, and
provision public backend APIs via Lambda. In addition, a local DEV server can be
started to emulate the resulting AWS infrastructure.

## Motivation

In my job I mainly build web apps on top of existing backend/CMS systems. Since
many of the frontend tech stacks are similar again and again, I created an
abstraction for the AWS CDK/SDK for a faster and easier setup.

Since existing backend/CMS systems are used, an additional persistence layer is
rarely required. Therefore, setting up such a layer (e.g. with Amazon DynamoDB)
is not supported.

I deliberately kept it simple. An app with a more complex setup should be set up
manually with the AWS CDK/SDK.

## Getting Started

### Install Dependencies

You need to install `aws-simple` and `aws-cdk` as dependencies, e.g. with:

```
yarn add --dev aws-simple aws-cdk
```

### Create An AWS IAM User

You need to
[create an AWS IAM user](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_users_create.html)
with programmatic access and the following attached policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "apigateway:*",
        "cloudformation:*",
        "iam:*",
        "lambda:*",
        "route53:*",
        "s3:*"
      ],
      "Resource": "*"
    }
  ]
}
```

_Note: This policy has more rights than necessary and
[should be more specific](https://github.com/clebert/aws-simple/issues/23) for
security._

### Optional: Create An AWS Profile

You can install the `aws` CLI, e.g. with:

```
brew install awscli
```

You can then set up the AWS profile using the credentials from the AWS IAM user
you just created:

```
aws configure
```

```
AWS Access Key ID [None]: ********************
AWS Secret Access Key [None]: ****************************************
Default region name [None]: eu-central-1
Default output format [None]: json
```

_Note: If a profile other than the `default` profile is to be set up, the `aws`
CLI can be called with the `--profile` CLI option, e.g.:_

```
aws configure --profile my-profile
```

As an alternative to using the `aws` CLI, you can create the following files
manually:

```
cat ~/.aws/credentials
```

```
[default]
aws_access_key_id = ********************
aws_secret_access_key = ****************************************
```

```
cat ~/.aws/config
```

```
[default]
output = json
region = eu-central-1
```

### Set The AWS Profile

The following two environment variables `AWS_PROFILE` and `AWS_DEFAULT_PROFILE`
are evaluated in the specified order. If neither of the two environment
variables is set, the `default` profile is used.

The following is an example of setting a specific profile:

```
AWS_PROFILE=my-profile yarn aws-simple list
```

### Set The AWS Credentials

The following two environment variables `AWS_ACCESS_KEY_ID` and
`AWS_SECRET_ACCESS_KEY` are evaluated. If these are not set, an attempt is made
to read the credentials from the AWS shared credentials file using the AWS
profile. The default location of the file (`~/.aws/credentials`) can be
overwritten by setting the environment variable `AWS_SHARED_CREDENTIALS_FILE`.

### Set The AWS Region

The following two environment variables `AWS_REGION` and `AWS_DEFAULT_REGION`
are evaluated in the specified order. If neither of the two environment
variables is set, an attempt is made to read the region from the AWS config file
using the AWS profile. The default location of the file (`~/.aws/config`) can be
overwritten by setting the environment variable `AWS_CONFIG_FILE`.

### Create A Config File

To use the `aws-simple` CLI you have to create a top-level config file named
`aws-simple.config.js` which exports an object compatible to the
[`AppConfig` interface](https://github.com/clebert/aws-simple/blob/master/src/types.ts#L88).

For example, a config file with the following content describes a simple app
consisting of a single static HTML file:

```js
exports.default = {
  appName: 'my-app',
  appVersion: 'latest',
  createStackConfig: (port) => ({
    s3Configs: [
      {
        type: 'file',
        publicPath: '/',
        localPath: 'dist/index.html',
        bucketPath: 'index.html',
      },
    ],
  }),
};
```

_Note: The `createStackConfig` function optionally gets a `port` argument. It is
set when the function is called in the context of the
`aws-simple start [options]` CLI command. This gives the opportunity to create
different
[`StackConfig` objects](https://github.com/clebert/aws-simple/blob/master/src/types.ts#L80)
for either AWS or the local DEV environment._

_The `createStackConfig` function is only called in the context of the following
CLI commands:_

- _`aws-simple create [options]`_
- _`aws-simple upload [options]`_
- _`aws-simple start [options]`_

### Bootstrap Your AWS Environment

Before you can use the AWS CDK you must
[bootstrap your AWS environment](https://docs.aws.amazon.com/cdk/latest/guide/tools.html)
to create the infrastructure that the AWS CDK CLI needs to deploy your app:

```
yarn cdk bootstrap --app 'yarn aws-simple create'
```

_Note: This command only needs to be executed once._

### Start A Local DEV Server

```
yarn aws-simple start
```

_Note: When changing the `aws-simple` config file, the DEV server must be
restarted. If a bundler such as Parcel or Webpack is used, its watcher must be
started in addition to the DEV server._

### Deploy A Stack To AWS

Create and deploy a stack using the CDK:

```
yarn cdk deploy --app 'yarn aws-simple create'
```

The name of the deployed stack consists of the app name (e.g. `my-app`) in
combination with the app version (e.g. `latest`) such as
`aws-simple--my-app--latest`.

**Caution:** Re-deploying an already deployed stack (so a stack with the same
name) will remove all tags set with `aws-simple tag [options]`.

Upload files to S3:

```
yarn aws-simple upload
```

Example `package.json` scripts:

```json
{
  "scripts": {
    "deploy": "cdk deploy --app 'yarn aws-simple create'",
    "postdeploy": "aws-simple upload"
  }
}
```

_Note: In a CI pipeline the `deploy` script should be called with the additional
argument `--require-approval never`, e.g.
`yarn deploy --require-approval never`._

## Configuration

### Use TypeScript For Auto-Completion Support

TypeScript 2.3 and later support type-checking in `*.js` files by adding a
`// @ts-check` comment to them:

```js
// @ts-check

/**
 * @type {import('aws-simple').AppConfig}
 */
exports.default = {
  appName: 'my-app',
  appVersion: 'latest',
  createStackConfig: () => ({
    /* ... */
  }),
};
```

### Configure A Custom Domain

In order to use a custom domain,
[a public certificate](https://docs.aws.amazon.com/acm/latest/userguide/gs-acm-request-public.html)
and
[a public hosted zone](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/CreatingHostedZone.html)
must be created manually. You can then configure a custom domain as follows:

```js
const appName = 'my-app';
const appVersion = process.env.APP_VERSION || 'latest';

exports.default = {
  appName,
  appVersion,
  createStackConfig: () => ({
    customDomainConfig: {
      certificateArn:
        'arn:aws:acm:eu-central-1:************:certificate/********-****-****-****-************',
      hostedZoneId: '**************',
      hostedZoneName: 'example.com',
      aliasRecordName: appVersion !== 'latest' ? appVersion : undefined,
    },
  }),
};
```

_Note: Different app versions allow multiple stacks of the same app to be
deployed simultaneously. In this case the optional `aliasRecordName` property is
used to give each stack its own URL, for example `example.com` or
`beta.example.com` (`APP_VERSION=beta`)._

### Configure A Lambda Function

You can configure a Lambda function that can be accessed via GET request at the
URL `my-app.example.com/endpoint` as follows:

```js
const appVersion = process.env.APP_VERSION || 'latest';

exports.default = {
  appName: 'my-app',
  appVersion,
  createStackConfig: (port) => ({
    lambdaConfigs: [
      {
        httpMethod: 'GET',
        publicPath: '/endpoint',
        localPath: 'path/to/lambda.js',

        // Optional example properties
        description: 'My Lambda function.',
        memorySize: 3008,
        timeoutInSeconds: 28,
        loggingLevel: 'INFO',
        cachingEnabled: true,
        cacheTtlInSeconds: 3600,
        acceptedParameters: {
          foo: {},
          bar: {isCacheKey: true},
          baz: {required: true},
          qux: {isCacheKey: true, required: true},
        },
        environment: {
          BASE_URL: port
            ? `http://localhost:${port}` // Local DEV server
            : `https://${appVersion}.example.com`,
        },
      },
    ],
  }),
};
```

The contents of file `path/to/lambda.js` could look like this:

```js
async function handler() {
  return {
    statusCode: 200,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify('Hello, World!'),
  };
}

exports.handler = handler;
```

If the export of the Lambda function node module has a different name than
`handler`, this must be explicitly specified in the Lambda configuration:

```js
exports.default = {
  appName: 'my-app',
  appVersion: 'latest',
  createStackConfig: () => ({
    lambdaConfigs: [
      {
        /* ... */
        handler: 'myHandler',
      },
    ],
  }),
};
```

_Note: If external node modules are to be referenced in the Lambda function node
module, it must be bundled with a bundler such as Webpack (in this case you have
to set the target to node: `{target: 'node'}`) to create a single node module
bundle._

### Configure An S3 File

You can configure an S3 file that can be accessed via GET request at the URL
`my-app.example.com/` as follows:

```js
exports.default = {
  appName: 'my-app',
  appVersion: 'latest',
  createStackConfig: () => ({
    s3Configs: [
      {
        type: 'file',
        publicPath: '/',
        localPath: 'path/to/file.html',

        // Optional example properties
        bucketPath: 'file.html',
        cachingEnabled: true,
        cacheTtlInSeconds: 3600,
      },
    ],
  }),
};
```

_Note: The file specified under the `localPath` is loaded into the S3 bucket
associated with the stack using the `aws-simple upload [options]` CLI command.
The optionally specified `bucketPath` or, if not specified, the `publicPath` is
used as the S3 object key._

### Configure An S3 Folder

You can configure an S3 folder whose contained files can be accessed via GET
request at the URL `my-app.example.com/assets/*` as follows:

```js
exports.default = {
  appName: 'my-app',
  appVersion: 'latest',
  createStackConfig: () => ({
    s3Configs: [
      {
        type: 'folder',
        publicPath: '/assets',
        localPath: 'path/to/folder',

        // Optional example properties
        responseHeaders: {
          cacheControl: 'max-age=157680000',
        },
        cachingEnabled: true,
        cacheTtlInSeconds: 3600,
      },
    ],
  }),
};
```

_Note: All files contained in the folder specified under the `localPath` are
loaded into the S3 bucket associated with the stack using the
`aws-simple upload [options]` command. Nested folders are ignored! Thus a
separate S3 config object must be created for each nested folder._

### Dynamically Set Config Properties

Since the config file is a node module, individual properties can also be set
dynamically. For example, you can set the `appVersion` based on the current Git
commit SHA or Git tag ref:

```js
const {isTagDirty, short, tag} = require('git-rev-sync');

function detectAppVersion() {
  const {GITHUB_REF, GITHUB_SHA} = process.env;

  if (GITHUB_REF) {
    return GITHUB_REF.replace(/\./g, '-');
  }

  if (GITHUB_SHA) {
    return GITHUB_SHA.slice(7);
  }

  if (isTagDirty()) {
    return short();
  }

  return tag().replace(/\./g, '-');
}

const appVersion = detectAppVersion();

exports.default = {
  appName: 'my-app',
  appVersion,
  createStackConfig: () => ({
    customDomainConfig: {
      /* ... */
      hostedZoneName: 'example.com',
      aliasRecordName: appVersion,
    },
  }),
};
```

### Enable Binary Support

You can specify media types (e.g. `image/png`, `application/octet-stream`, etc.)
to be treated as binary as follows:

```js
exports.default = {
  appName: 'my-app',
  appVersion: 'latest',
  createStackConfig: () => ({
    binaryMediaTypes: ['image/gif', 'image/jpeg', 'image/png'],
    s3Configs: [
      {
        type: 'folder',
        binary: true,
        publicPath: '/assets/images',
        localPath: 'path/to/folder',
      },
    ],
  }),
};
```

_Note: Please make sure that S3 config objects representing binary files are
declared accordingly (`binary: true`). S3 config objects representing folders
may only contain either binary or non-binary files._

### Enable Payload Compression

You can enable compression for an API as follows:

```js
exports.default = {
  appName: 'my-app',
  appVersion: 'latest',
  createStackConfig: () => ({
    minimumCompressionSizeInBytes: 1000,
  }),
};
```

### Enable CORS

Basic CORS support can be enabled as follows:

```js
exports.default = {
  appName: 'my-app',
  appVersion: 'latest',
  createStackConfig: () => ({
    enableCors: true,
  }),
};
```

_Note: Additionally, Lambda handlers must explicitly set any required CORS
headers like `Access-Control-Allow-Origin` on their response._

### Enable Basic Authentication

You can configure basic authentication for an API, and require authentication
for certain API methods, as follows:

```js
exports.default = {
  appName: 'my-app',
  appVersion: 'latest',
  createStackConfig: () => ({
    basicAuthenticationConfig: {
      username: process.env.USERNAME,
      password: process.env.PASSWORD,
      cacheTtlInSeconds: 300,
    },
    lambdaConfigs: [
      {
        httpMethod: 'GET',
        publicPath: '/secret-endpoint',
        localPath: 'path/to/secret-lambda.js',
        authenticationRequired: true,
      },
      {
        httpMethod: 'GET',
        publicPath: '/public-endpoint',
        localPath: 'path/to/public-lambda.js',
      },
    ],
    s3Configs: [
      {
        type: 'file',
        publicPath: '/secret-file',
        localPath: 'path/to/secret-file.html',
        authenticationRequired: true,
      },
      {
        type: 'file',
        publicPath: '/public-file',
        localPath: 'path/to/public-file.html',
      },
    ],
  }),
};
```

_Note: Basic authentication is not handled by the local DEV server._

### Configure A Single-Page Application (SPA)

It can be useful to deliver the same single-page Application under different
paths. Instead of specifying multiple `s3Configs` or `lambdaConfigs`, you can
also specify a _catch-all_ `s3Config` or `lambdaConfig`. For example a single
greedy `publicPath` (e.g. `publicPath: '/{proxy+}'`) will match requests made to
`/foo`, `/bar`, and `/baz/qux`, but to match also `/` it needs a non-greedy
`publicPath` (`publicPath: '/'`) in addition.

#### S3 Example

```js
exports.default = {
  appName: 'my-app',
  appVersion: 'latest',
  createStackConfig: () => ({
    s3Configs: [
      {
        type: 'file',
        publicPath: '/',
        localPath: 'dist/index.html',
        bucketPath: 'index.html',
      },
      {
        type: 'file',
        publicPath: '/{proxy+}',
        localPath: 'dist/index.html',
        bucketPath: 'index.html',
      },
    ],
  }),
};
```

#### Lambda Example

```js
exports.default = {
  appName: 'my-app',
  appVersion: 'latest',
  createStackConfig: () => ({
    lambdaConfigs: [
      {
        httpMethod: 'GET',
        publicPath: '/',
        localPath: 'path/to/lambda.js',
      },
      {
        httpMethod: 'GET',
        publicPath: '/{proxy+}',
        localPath: 'path/to/lambda.js',
      },
    ],
  }),
};
```

### Troubleshooting

[Some changes](https://docs.aws.amazon.com/apigateway/latest/developerguide/updating-api.html)
to an existing stack require a redeployment of the API Gateway. So if changes to
a stack do not work, the `aws-simple redeploy` command might help.

## CLI Usage

```
Usage: aws-simple <command> [options]

Commands:
  aws-simple create [options]    Create a stack using the CDK
  aws-simple upload [options]    Upload files to S3
  aws-simple start [options]     Start a local DEV server
  aws-simple list [options]      List all deployed stacks
  aws-simple tag [options]       Tag a deployed stack
  aws-simple clean-up [options]  Clean up old deployed stacks
  aws-simple redeploy [options]  Redeploy the API Gateway

Options:
  --version   Show version number                                      [boolean]
  -h, --help  Show help                                                [boolean]

A Node.js interface for AWS that allows easy configuration and deployment of
simple web apps.
```

### Create A Stack Using The CDK

```
aws-simple create [options]

Create a stack using the CDK

Options:
  --version   Show version number                                      [boolean]
  -h, --help  Show help                                                [boolean]

Examples:
  npx aws-simple create
  npx cdk deploy --app 'npx aws-simple create'
```

### Upload Files To S3

```
aws-simple upload [options]

Upload files to S3

Options:
  --version   Show version number                                      [boolean]
  -h, --help  Show help                                                [boolean]

Examples:
  npx aws-simple upload
```

### Start A Local DEV Server

```
aws-simple start [options]

Start a local DEV server

Options:
  --version   Show version number                                      [boolean]
  -h, --help  Show help                                                [boolean]
  --port      The port to listen on if available, otherwise listen on a random
              port                                      [number] [default: 3000]
  --cache     Enable caching of successful caching-enabled Lambda function
              results per request URL                 [boolean] [default: false]
  --verbose   Enable logging of successful Lambda function results
                                                      [boolean] [default: false]

Examples:
  npx aws-simple start
  npx aws-simple start --port 3001 --cache --verbose
```

### List All Deployed Stacks

```
aws-simple list [options]

List all deployed stacks

Options:
  --version   Show version number                                      [boolean]
  -h, --help  Show help                                                [boolean]

Examples:
  npx aws-simple list
```

### Tag A Deployed Stack

```
aws-simple tag [options]

Tag a deployed stack

Options:
  --version   Show version number                                      [boolean]
  -h, --help  Show help                                                [boolean]
  --add       The tags to add                              [array] [default: []]
  --remove    The tags to remove                           [array] [default: []]
  --yes       The confirmation message will automatically be answered with yes
                                                      [boolean] [default: false]

Examples:
  npx aws-simple tag --add latest release --remove prerelease
  npx aws-simple tag --add prerelease --yes
```

### Clean Up Old Deployed Stacks

```
aws-simple clean-up [options]

Clean up old deployed stacks

Options:
  --version   Show version number                                      [boolean]
  -h, --help  Show help                                                [boolean]
  --min-age   The minimum age (in days) of a stack for deletion
                                                          [number] [default: 30]
  --exclude   Tags that exclude a stack from deletion      [array] [default: []]
  --yes       The confirmation message will automatically be answered with yes
                                                      [boolean] [default: false]

Examples:
  npx aws-simple clean-up
  npx aws-simple clean-up --min-age 14 --exclude release prerelease --yes
```

### Redeploy The API Gateway

```
aws-simple redeploy [options]

Redeploy the API Gateway

Options:
  --version   Show version number                                      [boolean]
  -h, --help  Show help                                                [boolean]

Examples:
  npx aws-simple redeploy
```

## Development

### Publish A New Release

```
yarn release patch
```

```
yarn release minor
```

```
yarn release major
```

After a new release has been created by pushing the tag, it must be published
via the GitHub UI. This triggers the final publication to npm.

---

Copyright (c) 2019, Clemens Akens. Released under the terms of the
[MIT License](https://github.com/clebert/aws-simple/blob/master/LICENSE).
