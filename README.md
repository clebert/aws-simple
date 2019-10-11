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

### aws-simple-example

For a quick impression, an
[example app](https://github.com/clebert/aws-simple-example) is available that
consists essentially of a React component that retrieves text from a Lambda
function using a `React.useEffect` hook and displays it. Parcel is used for
bundling and TypeScript as language.

## Motivation

In my job I mainly build web apps on top of existing backend/CMS systems. Since
many of the frontend tech stacks are similar again and again, I created an
abstraction for the AWS CDK/SDK for a faster and easier setup.

Since existing backend/CMS systems are used, an additional persistence layer is
rarely required. Therefore, setting up such a layer (e.g. with Amazon DynamoDB)
is [currently not supported](https://github.com/clebert/aws-simple/issues/12).

I deliberately kept it simple. An app with a more complex setup should be set up
manually with the AWS CDK/SDK.

## Getting Started

### Install Dependencies

You need to install `aws-simple` and `aws-cdk` as dependencies, e.g. with:

```
yarn add --dev aws-simple aws-cdk
```

```
npm install --save-dev aws-simple aws-cdk
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
      "Action": ["cloudformation:*", "apigateway:*", "s3:*"],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": ["lambda:*"],
      "Resource": "arn:aws:lambda:*:*:function:myapp-*"
    },
    {
      "Effect": "Allow",
      "Action": ["iam:*"],
      "Resource": "arn:aws:iam::*:role/myapp-*"
    },
    {
      "Effect": "Allow",
      "Action": ["iam:CreateServiceLinkedRole"],
      "Resource": "arn:aws:iam::*:role/aws-service-role/ops.apigateway.amazonaws.com/*"
    },
    {
      "Effect": "Allow",
      "Action": ["route53:*"],
      "Resource": "arn:aws:route53:::*"
    }
  ]
}
```

_Note: Please replace the app name (`myapp`) with your own. All resources
created with CloudFormation have the app name combined with the stack name as a
prefix for their ID such as `myapp-mystack-resource-s3-bucket`._

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

As an alternative to using the `aws` CLI, you can create the following files
manually:

```
cat ~/.aws/credentials
[default]
aws_access_key_id = ********************
aws_secret_access_key = ****************************************
```

```
cat ~/.aws/config
[default]
output = json
region = eu-central-1
```

### Set The AWS Profile

The following two environment variables `AWS_PROFILE` and `AWS_DEFAULT_PROFILE`
are evaluated in the specified order. If neither of the two environment
variables is set, the `default` profile is used.

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

To use the `aws-simple` CLI you have to create a top-level node module config
file named `aws-simple.config.js` which exports an object compatible to the
[`AppConfig` interface](https://github.com/clebert/aws-simple/blob/master/src/index.ts#L86).

For example, the following app config describes a simple app consisting of a
single static HTML file:

```js
exports.default = {
  appName: 'myapp',
  defaultStackName: 'mystack',
  s3Configs: [
    {
      type: 'file',
      publicPath: '/',
      localPath: 'dist/app/index.html',
      bucketPath: 'index.html'
    }
  ]
};
```

_Note: Different stack names allow multiple stacks of the same app to be
deployed simultaneously. The specified default stack name can be overwritten
with most `aws-simple` CLI commands using the `--stack-name` CLI option._

### Bootstrap Your AWS Environment

Before you can use the AWS CDK you must bootstrap your AWS environment to create
the infrastructure that the AWS CDK CLI needs to deploy your AWS CDK app:

```
npx cdk bootstrap --app 'npx aws-simple create'
```

_Note: This command only needs to be executed once. For more information see
[here](https://docs.aws.amazon.com/cdk/latest/guide/tools.html)._

### Start A Local DEV Server

```
npx aws-simple start --port 1985 --cached
```

_Note: When changing the `aws-simple` config file, the DEV server must be
restarted. If a bundler such as Parcel or Webpack is used, its watcher must be
started in addition to the DEV server._

### Deploy A Stack To AWS

Create a stack using the CDK:

```
npx cdk deploy --app 'npx aws-simple create'
```

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

_Note: In a CI pipeline the `deploy` script should be called with the additional
argument `--require-approval never`, e.g.
`npm run deploy --require-approval never`._

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
  appName: 'myapp',
  defaultStackName: 'mystack'
};
```

### Example Configuration Of A Custom Domain

In order to use a custom domain,
[a certificate](https://docs.aws.amazon.com/acm/latest/userguide/gs-acm-request-public.html)
and
[a hosted zone](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/CreatingHostedZone.html)
must be created manually. You can then configure the custom domain as follows:

```js
exports.default = {
  /* ... */
  customDomainConfig: {
    certificateArn:
      'arn:aws:acm:eu-central-1:************:certificate/********-****-****-****-************',
    hostedZoneId: '**************',
    hostedZoneName: 'example.com',
    getAliasRecordName: stackName => stackName
  }
};
```

_Note: Different stack names allow multiple stacks of the same app to be
deployed simultaneously. In this case the optional `getAliasRecordName` function
is used to give each stack its own URL, for example `mystack.example.com`._

### Example Configuration Of A Lambda Function

You can configure a Lambda function that can be accessed via GET request at the
URL `mystack.example.com/endpoint` as follows:

```js
exports.default = {
  /* ... */
  lambdaConfigs: [
    {
      httpMethod: 'GET',
      publicPath: '/endpoint',
      localPath: 'path/to/lambda.js',

      // Optional example properties
      memorySize: 3008,
      timeoutInSeconds: 30,
      cachingEnabled: true,
      cacheTtlInSeconds: 600,
      acceptedParameters: {
        foo: {},
        bar: {isCacheKey: true},
        baz: {required: true},
        qux: {isCacheKey: true, required: true}
      },
      getEnvironment: runtime => ({
        BASE_URL:
          runtime.type === 'dev'
            ? `http://localhost:${runtime.port}`
            : `https://${runtime.stackName}.example.com`
      })
    }
  ]
};
```

The contents of file `path/to/lambda.js` could look like this:

```js
async function handler() {
  return {
    statusCode: 200,
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify('Hello, World!')
  };
}

exports.handler = handler;
```

If the export of the Lambda function node module has a different name than
`handler`, this must be explicitly specified in the Lambda configuration:

```js
exports.default = {
  /* ... */
  lambdaConfigs: [
    {
      /* ... */
      handler: 'myHandler'
    }
  ]
};
```

_Note: If external node modules are to be referenced in the Lambda function node
module, it must be bundled with a bundler such as Webpack (in this case you have
to set the target to node: `{target: 'node'}`) to create a single node module
bundle._

### Example Configuration Of An S3 File

You can configure an S3 file that can be accessed via GET request at the URL
`mystack.example.com/` as follows:

```js
exports.default = {
  /* ... */
  s3Configs: [
    {
      type: 'file',
      publicPath: '/',
      localPath: 'path/to/file.html',
      bucketPath: 'file.html'
    }
  ]
};
```

_Note: The file specified under the local path is loaded into the S3 bucket
associated with the stack using the `aws-simple upload [options]` CLI command.
The optionally specified bucket path or, if not specified, the public path is
used as the S3 object key._

### Example Configuration Of An S3 Folder

You can configure an S3 folder whose contained files can be accessed via GET
request at the URL `mystack.example.com/assets/*` as follows:

```js
exports.default = {
  /* ... */
  s3Configs: [
    {
      type: 'folder',
      publicPath: '/assets',
      localPath: 'path/to/folder',
      responseHeaders: {
        accessControlAllowOrigin: '*',
        cacheControl: 'max-age=157680000'
      }
    }
  ]
};
```

_Note: All files contained in the folder specified under the local path are
loaded into the S3 bucket associated with the stack using the
`aws-simple upload [options]` command. Nested folders are ignored! Thus a
separate S3 Config must be created for each nested folder._

### Dynamically Set Config Properties

Since the config file is a node module, individual properties can also be set
dynamically. For example, you can set the default stack name based on the
current hash or tag:

```js
const {isTagDirty, short, tag} = require('git-rev-sync');

exports.default = {
  /* ... */
  defaultStackName: isTagDirty()
    ? short(undefined, 8)
    : tag().replace(/\./g, '-')
};
```

### Enable Binary Support

You can specify media types (e.g. `image/png`, `application/octet-stream`, etc.)
to be treated as binary as follows:

```js
exports.default = {
  /* ... */
  binaryMediaTypes: ['font/woff2']
};
```

### Enable Payload Compression

You can enable compression for an API as follows:

```js
exports.default = {
  /* ... */
  minimumCompressionSizeInBytes: 1000
};
```

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
  --version     Show version number                                    [boolean]
  -h, --help    Show help                                              [boolean]
  --config      The path to the config file
                                      [string] [default: "aws-simple.config.js"]
  --stack-name  The stack name to be used instead of the default one declared in
                the config file                                         [string]

Examples:
  npx cdk deploy --app 'npx aws-simple create'
  npx cdk deploy --app 'npx aws-simple create --stack-name stage'
```

### Upload Files To S3

```
aws-simple upload [options]

Upload files to S3

Options:
  --version     Show version number                                    [boolean]
  -h, --help    Show help                                              [boolean]
  --config      The path to the config file
                                      [string] [default: "aws-simple.config.js"]
  --stack-name  The stack name to be used instead of the default one declared in
                the config file                                         [string]

Examples:
  npx aws-simple upload
  npx aws-simple upload --stack-name stage
```

### Start A Local DEV Server

```
aws-simple start [options]

Start a local DEV server

Options:
  --version   Show version number                                      [boolean]
  -h, --help  Show help                                                [boolean]
  --config    The path to the config file
                                      [string] [default: "aws-simple.config.js"]
  --port      The port to listen on                     [number] [default: 3000]
  --cached    Enable caching of successful Lambda function results per request
              URL                                     [boolean] [default: false]
  --verbose   Enable logging of successful Lambda function results
                                                      [boolean] [default: false]

Examples:
  npx aws-simple start
  npx aws-simple start --port 1985 --cached
```

### List All Deployed Stacks

```
aws-simple list [options]

List all deployed stacks

Options:
  --version   Show version number                                      [boolean]
  -h, --help  Show help                                                [boolean]
  --config    The path to the config file
                                      [string] [default: "aws-simple.config.js"]

Examples:
  npx aws-simple list
```

### Tag A Deployed Stack

```
aws-simple tag [options]

Tag a deployed stack

Options:
  --version     Show version number                                    [boolean]
  -h, --help    Show help                                              [boolean]
  --config      The path to the config file
                                      [string] [default: "aws-simple.config.js"]
  --tag-name    The tag name                                 [string] [required]
  --stack-name  The stack name to be used instead of the default one declared in
                the config file                                         [string]

Examples:
  npx aws-simple tag --tag-name release
  npx aws-simple tag --tag-name release --stack-name stage
```

### Clean Up Old Deployed Stacks

```
aws-simple clean-up [options]

Clean up old deployed stacks

Options:
  --version   Show version number                                      [boolean]
  -h, --help  Show help                                                [boolean]
  --config    The path to the config file
                                      [string] [default: "aws-simple.config.js"]
  --max-age   The maximum age (in days) of a stack, all older stacks will be
              deleted                                     [number] [default: 30]
  --preserve  Optional tag names that prevent a stack from being deleted
              regardless of its age                                      [array]
  --yes       The confirmation message will automatically be answered with Yes
                                                      [boolean] [default: false]

Examples:
  npx aws-simple clean-up
  npx aws-simple clean-up --max-age 14 --preserve release
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
