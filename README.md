# aws-simple

![](https://github.com/clebert/aws-simple/workflows/CI/badge.svg)

A Node.js interface for **AWS** that allows easy configuration and deployment of
**simple** web apps.

## Contents

- [Quick Overview](#quick-overview)
- [Motivation](#motivation)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [CLI Usage](#cli-usage)

## Quick Overview

`aws-simple` allows you to easily create and deploy an API Gateway with a custom
domain and optional alias record, host static web resources via S3, and
provision public back-end APIs via Lambda. In addition, a local DEV server can
be started to emulate the resulting AWS infrastructure.

## Motivation

<details>
  <summary>Show details</summary>

In my job I mainly build web apps on top of existing back-end/CMS systems. Since
many of the frontend tech stacks are similar, I created an abstraction for the
AWS CDK/SDK for a faster and easier setup.

Since existing back-end/CMS systems are used, an additional persistence layer is
rarely required. Therefore, setting up such a layer (e.g. with Amazon DynamoDB)
is not supported.

I deliberately kept it simple. An app with a more complex setup should be set up
manually with the AWS CDK/SDK.

</details>

## Getting Started

### Install dependencies

```
npm install aws-simple --save-dev
```

### Create a config file

To use the `aws-simple` CLI you have to create a top-level config file named
`aws-simple.config.js` which exports an object compatible to the
[`App`](https://github.com/clebert/aws-simple/blob/master/src/new-types.ts#L1)
interface.

For example, a config file with the following content describes a simple app
consisting of a single static HTML file:

```js
exports.default = {
  appName: 'my-app',
  routes: (port) => ({
    '/': {kind: 'file', filename: 'dist/index.html'},
  }),
};
```

**Note:** The `routes` function optionally gets a `port` argument. It is set
when the function is called in the context of the `aws-simple start [options]`
CLI command. This gives the opportunity to create different routes for either
AWS or the local DEV environment.

**Link:** As a real-world example, you can find the `aws-simple` configuration
for one of my open source applications
[here](https://github.com/clebert/bookmark.wtf/blob/main/aws-simple.config.js).

### Create an AWS IAM user

<details>
  <summary>Show details</summary>

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

**Caution:** This policy has more rights than necessary and
[should be more specific](https://github.com/clebert/aws-simple/issues/23) for
security.

</details>

### Optional: Create an AWS profile

<details>
  <summary>Show details</summary>

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

If a profile other than the `default` profile is to be set up, the `aws` CLI can
be called with the `--profile` CLI option, e.g.:

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

</details>

### Set the AWS profile

<details>
  <summary>Show details</summary>

The following two environment variables `AWS_PROFILE` and `AWS_DEFAULT_PROFILE`
are evaluated in the specified order. If neither of the two environment
variables is set, the `default` profile is used.

The following is an example of setting a specific profile:

```
AWS_PROFILE=my-profile npx aws-simple list
```

</details>

### Set the AWS credentials

<details>
  <summary>Show details</summary>

The following two environment variables `AWS_ACCESS_KEY_ID` and
`AWS_SECRET_ACCESS_KEY` are evaluated. If these are not set, an attempt is made
to read the credentials from the AWS shared credentials file using the AWS
profile. The default location of the file (`~/.aws/credentials`) can be
overwritten by setting the environment variable `AWS_SHARED_CREDENTIALS_FILE`.

</details>

### Set the AWS region

<details>
  <summary>Show details</summary>

The following two environment variables `AWS_REGION` and `AWS_DEFAULT_REGION`
are evaluated in the specified order. If neither of the two environment
variables is set, an attempt is made to read the region from the AWS config file
using the AWS profile. The default location of the file (`~/.aws/config`) can be
overwritten by setting the environment variable `AWS_CONFIG_FILE`.

</details>

### Bootstrap the AWS environment

<details>
  <summary>Show details</summary>

Before you can use the AWS CDK you must
[bootstrap your AWS environment](https://docs.aws.amazon.com/cdk/latest/guide/tools.html)
to create the infrastructure that the AWS CDK CLI needs to deploy your app:

```
npx cdk bootstrap --app 'npx aws-simple create'
```

</details>

### Start a local DEV server

<details>
  <summary>Show details</summary>

```
npx aws-simple start
```

**Note:** When changing the `aws-simple` config file, the DEV server must be
restarted. If a bundler such as Parcel or Webpack is used, its watcher must be
started in addition to the DEV server.

</details>

### Deploy a stack to AWS

<details>
  <summary>Show details</summary>

Create and deploy a stack using the CDK:

```
npx cdk deploy --app 'npx aws-simple create'
```

The name of the deployed stack consists of the app name (e.g. `my-app`) in
combination with the app version (e.g. `latest`) such as
`aws-simple--my-app--latest`.

**Caution:** Re-deploying an already deployed stack (so a stack with the same
name) will remove all tags set with `aws-simple tag [options]`.

Upload files to S3:

```
npx aws-simple upload
```

Example `package.json` scripts:

```json
{
  "scripts": {
    "deploy": "cdk deploy --app 'npx aws-simple create'",
    "postdeploy": "aws-simple upload"
  }
}
```

**Note:** In a CI pipeline the `deploy` script should be called with the
additional argument `--require-approval never`, e.g.
`npm run deploy -- --require-approval never`.

</details>

## Configuration

### Use TypeScript for auto-completion support

<details>
  <summary>Show details</summary>

TypeScript 2.3 and later support type-checking in `*.js` files by adding a
`// @ts-check` comment to them:

```js
// @ts-check

/**
 * @type {import('aws-simple').App}
 */
exports.default = {
  appName: 'my-app',
  routes: () => ({
    /* ... */
  }),
};
```

</details>

### Configure a custom domain

<details>
  <summary>Show details</summary>

In order to use a custom domain,
[a public certificate](https://docs.aws.amazon.com/acm/latest/userguide/gs-acm-request-public.html)
and
[a public hosted zone](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/CreatingHostedZone.html)
must be created manually. You can then configure a custom domain as follows:

```js
const appVersion = process.env.APP_VERSION;

exports.default = {
  appName: 'my-app',
  appVersion,
  customDomain: {
    certificateArn:
      'arn:aws:acm:eu-central-1:************:certificate/********-****-****-****-************',
    hostedZoneId: '**************',
    hostedZoneName: 'example.com',
    aliasRecordName: appVersion ? appVersion : undefined,
  },
  routes: () => ({
    /* ... */
  }),
};
```

**Note:** Different app versions allow multiple stacks of the same app to be
deployed simultaneously. In this case the optional `aliasRecordName` property is
used to give each stack its own URL, e.g. `example.com` or `beta.example.com`
(`APP_VERSION=beta`).

</details>

### Configure a Lambda function

<details>
  <summary>Show details</summary>

You can configure a Lambda function that can be accessed via GET request under
the `/hello` path as follows:

```js
exports.default = {
  appName: 'my-app',
  routes: () => ({
    '/hello': {kind: 'function', filename: 'dist/hello.js'},
  }),
};
```

The contents of file `dist/hello.js` could look like this:

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

**Note:** If external modules are to be referenced in the Lambda function, it
must be bundled with a bundler such as Webpack (in this case you have to set the
target to node: `{target: 'node'}`) to create a single self-contained file.

</details>

### Configure an S3 file

<details>
  <summary>Show details</summary>

You can configure an S3 file that can be accessed via GET request under the `/`
path as follows:

```js
exports.default = {
  appName: 'my-app',
  routes: () => ({
    '/': {kind: 'file', filename: 'dist/index.html'},
  }),
};
```

</details>

### Configure an S3 folder

<details>
  <summary>Show details</summary>

You can configure an S3 folder that can be accessed via GET request under the
`/assets/*` path as follows:

```js
exports.default = {
  appName: 'my-app',
  routes: () => ({
    '/assets': {kind: 'folder', dirname: 'dist/assets'},
  }),
};
```

**Note:** All files contained in the folder specified under the `dirname`
property are loaded into the S3 bucket associated with the stack using the
`aws-simple upload [options]` command.

**Important:** Nested folders are ignored! Thus a separate route must be created
for each nested folder.

</details>

### Enable binary support

<details>
  <summary>Show details</summary>

You can specify media types (e.g. `image/png`, `application/octet-stream`, etc.)
to be treated as binary as follows:

```js
exports.default = {
  appName: 'my-app',
  routes: () => ({
    '/images': {
      kind: 'folder',
      dirname: 'dist/images',
      binaryMediaTypes: ['image/gif', 'image/jpeg', 'image/png'],
    },
  }),
};
```

**Important:** Folders may only contain either binary or non-binary files.

</details>

### Enable CORS

<details>
  <summary>Show details</summary>

To enable CORS for a route, you can set its `enableCors` property to `true`:

```js
exports.default = {
  appName: 'my-app',
  routes: () => ({
    '/': {kind: 'file', filename: 'dist/index.html', enableCors: true},
    '/assets': {kind: 'folder', dirname: 'dist/assets', enableCors: true},
    '/hello': {kind: 'function', filename: 'dist/hello.js', enableCors: true},
  }),
};
```

Additionally, Lambda functions must explicitly set any required CORS headers
like `Access-Control-Allow-Origin` on their response:

```js
async function handler() {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify('Hello, World!'),
  };
}

exports.handler = handler;
```

**Caution:** During a transition period, the old configuration format continues
to be used under the hood. This means that CORS cannot be activated by route. As
soon as a route has activated CORS, this applies to all routes!

</details>

### Enable basic authentication

<details>
  <summary>Show details</summary>

To enable basic authentication for a route, you can set its
`enableAuthentication` property to `true`:

```js
exports.default = {
  appName: 'my-app',
  authentication: {
    username: process.env.USERNAME,
    password: process.env.PASSWORD,
  },
  routes: () => ({
    '/': {
      kind: 'file',
      filename: 'dist/index.html',
      enableAuthentication: true,
    },
    '/assets': {
      kind: 'folder',
      dirname: 'dist/assets',
      enableAuthentication: true,
    },
    '/hello': {
      kind: 'function',
      filename: 'dist/hello.js',
      enableAuthentication: true,
    },
  }),
};
```

**Note:** Basic authentication is not simulated by the local DEV server.

</details>

### Configure a single-page application (SPA)

<details>
  <summary>Show details</summary>

It can be useful to deliver the same single-page application under different
paths. Instead of specifying multiple routes, you can set the `catchAll`
property of a file or function route to `true`:

```js
exports.default = {
  appName: 'my-app',
  routes: (port) => ({
    '/': {kind: 'file', filename: 'dist/index.html', catchAll: true},
    '/assets': {kind: 'folder', dirname: 'dist/assets'},
    '/hello': {kind: 'function', filename: 'dist/hello.js'},
  }),
};
```

</details>

### Troubleshooting

<details>
  <summary>Show details</summary>

[Some changes](https://docs.aws.amazon.com/apigateway/latest/developerguide/updating-api.html)
to an existing stack require a redeployment of the API Gateway. So if changes to
a stack do not work, the `aws-simple redeploy` command might help.

</details>

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
      --version  Show version number                                   [boolean]
  -h, --help     Show help                                             [boolean]

A Node.js interface for AWS that allows easy configuration and deployment of
simple web apps.
```

### Create a stack using the CDK

<details>
  <summary>Show details</summary>

```
aws-simple create [options]

Create a stack using the CDK

Options:
      --version  Show version number                                   [boolean]
  -h, --help     Show help                                             [boolean]

Examples:
  npx aws-simple create
  npx cdk deploy --app 'npx aws-simple create'
```

</details>

### Upload files to S3

<details>
  <summary>Show details</summary>

```
aws-simple upload [options]

Upload files to S3

Options:
      --version  Show version number                                   [boolean]
  -h, --help     Show help                                             [boolean]

Examples:
  npx aws-simple upload
```

</details>

### Start a local DEV server

<details>
  <summary>Show details</summary>

```
aws-simple start [options]

Start a local DEV server

Options:
      --version  Show version number                                   [boolean]
  -h, --help     Show help                                             [boolean]
      --port     The port to listen on if available, otherwise listen on a
                 random port                            [number] [default: 3000]
      --cache    Enable caching of successful caching-enabled Lambda function
                 results per request URL              [boolean] [default: false]
      --verbose  Enable logging of successful Lambda function results
                                                      [boolean] [default: false]

Examples:
  npx aws-simple start
  npx aws-simple start --port 3001 --cache --verbose
```

</details>

### List all deployed stacks

<details>
  <summary>Show details</summary>

```
aws-simple list [options]

List all deployed stacks

Options:
      --version  Show version number                                   [boolean]
  -h, --help     Show help                                             [boolean]

Examples:
  npx aws-simple list
```

</details>

### Tag a deployed stack

<details>
  <summary>Show details</summary>

```
aws-simple tag [options]

Tag a deployed stack

Options:
      --version  Show version number                                   [boolean]
  -h, --help     Show help                                             [boolean]
      --add      The tags to add                           [array] [default: []]
      --remove   The tags to remove                        [array] [default: []]
      --yes      The confirmation message will automatically be answered with
                 yes                                  [boolean] [default: false]

Examples:
  npx aws-simple tag --add latest release --remove prerelease
  npx aws-simple tag --add prerelease --yes
```

</details>

### Clean up old deployed stacks

<details>
  <summary>Show details</summary>

```
aws-simple clean-up [options]

Clean up old deployed stacks

Options:
      --version  Show version number                                   [boolean]
  -h, --help     Show help                                             [boolean]
      --min-age  The minimum age (in days) of a stack for deletion
                                                          [number] [default: 30]
      --exclude  Tags that exclude a stack from deletion   [array] [default: []]
      --yes      The confirmation message will automatically be answered with
                 yes                                  [boolean] [default: false]

Examples:
  npx aws-simple clean-up
  npx aws-simple clean-up --min-age 14 --exclude release prerelease --yes
```

</details>

### Redeploy the API Gateway

<details>
  <summary>Show details</summary>

```
aws-simple redeploy [options]

Redeploy the API Gateway

Options:
      --version  Show version number                                   [boolean]
  -h, --help     Show help                                             [boolean]

Examples:
  npx aws-simple redeploy
```

</details>

---

Copyright (c) 2019-2021, Clemens Akens. Released under the terms of the
[MIT License](https://github.com/clebert/aws-simple/blob/master/LICENSE).
