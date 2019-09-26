# aws-simple

![][ci-badge]

A Node.js interface for **AWS** that allows easy configuration and deployment of
**simple** web projects.

## Quick Overview

`aws-simple` allows you to easily create and deploy an API Gateway with a custom
domain and optional alias record, make static files available via S3 and e.g.
provision a BFF (Backend for Frontend) via Lambda. In addition, a local DEV
server can be started to emulate the resulting AWS infrastructure.

### aws-simple-example

For a quick impression, an [example project][aws-simple-example] is available
that consists essentially of a React component that retrieves text from a Lambda
BFF (Backend for Frontend) using a `React.useEffect` hook and displays it.
Parcel is used for bundling and TypeScript as language.

## Motivation

In my job I mainly build frontend web applications for existing backend/CMS
systems. Since many of the frontend tech stacks are similar again and again, I
created an abstraction for the AWS CDK/SDK for a faster and easier setup.

Since existing backend/CMS systems are used, there is rarely a need for own
persistence layers. Therefore, setting these up is not part of this abstraction
for the time being.

I deliberately kept it simple. A project with a more complex setup should be set
up manually with the AWS CDK/SDK.

## Getting Started

### Install

Install `aws-simple` as development dependency, e.g. with:

```
yarn add --dev aws-simple
```

### Create AWS IAM User

Create an AWS IAM user with programmatic access and the following attached
policy:

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
created with CloudFormation have the app name combined with the stack ID as a
prefix for their own ID such as `myapp-mystack-resource-s3-bucket`._

### Create AWS CLI profile

Install the `aws` CLI, e.g. with:

```
brew install awscli
```

Then set up the AWS CLI profile using the access key from the AWS IAM user you
just created:

```
aws configure --profile clebert
```

```
AWS Access Key ID [None]: ********************
AWS Secret Access Key [None]: ****************************************
Default region name [None]: eu-central-1
Default output format [None]: json
```

As an alternative to using the `aws` CLI, the following files can also be
created manually:

```
cat ~/.aws/credentials
[clebert]
aws_access_key_id = ********************
aws_secret_access_key = ****************************************
```

```
cat ~/.aws/config
[profile clebert]
output = json
region = eu-central-1
```

_Note: Please replace the profile (`clebert`) and also the region
(`eu-central-1`) if necessary._

### Create Config File

Create a top-level configuration file called `aws-simple.config.js` in your
project. The following describes a very simple stack including a static HTML
file:

```js
exports.default = {
  appName: 'myapp',
  stackId: 'mystack',
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

#### Use TypeScript for auto-completion support

```js
// @ts-check

/**
 * @type {import('aws-simple').StackConfig}
 */
exports.default = {
  appName: 'myapp',
  stackId: 'mystack'
};
```

_Note: The `StackConfig` interface can be viewed [here][stack-config-type]._

### Bootstrap AWS Environment

Before you can use the AWS CDK you must bootstrap your AWS environment to create
the infrastructure that the AWS CDK CLI needs to deploy your AWS CDK app:

```
yarn cdk bootstrap --app 'yarn aws-simple create' --profile clebert
```

_Note: This command only needs to be executed once. For more information see
[here][cdk-guide]._

### Deploy Stack to AWS

```
yarn cdk deploy --app 'yarn aws-simple create' --profile clebert
```

```
yarn aws-simple upload --profile clebert --region eu-central-1
```

_Note: Different stack IDs allow multiple stacks of the same app to be deployed
simultaneously. For example, the `aliasRecordName` in the `customDomainConfig`
can be used to give each stack its own URL._

#### `package.json` Scripts Example

```json
{
  "scripts": {
    "deploy": "cdk deploy --app 'yarn aws-simple create' --profile clebert",
    "postdeploy": "aws-simple upload --profile clebert --region eu-central-1"
  }
}
```

_Note: In a CI pipeline the `deploy` script should be called with the additional
argument `--require-approval never`, e.g.
`yarn deploy --require-approval never`._

### Start Local DEV Server

```
yarn aws-simple start --port 1985 --cached
```

_Note: If a bundler such as Parcel or Webpack is used, its watcher must be
started in addition to the DEV server._

_When changing the `aws-simple` config file, the DEV server must be restarted._

## CLI Usage

```
Usage: aws-simple <command> [options]

Commands:
  aws-simple create [options]  Create a stack using the CDK
  aws-simple upload [options]  Upload files to S3
  aws-simple start [options]   Start local DEV server

Options:
  --version   Show version number                                      [boolean]
  -h, --help  Show help                                                [boolean]
```

### Create a stack using the CDK

```
aws-simple create [options]

Create a stack using the CDK

Options:
  --version   Show version number                                      [boolean]
  -h, --help  Show help                                                [boolean]
  --config    The path to the config file
                                      [string] [default: "aws-simple.config.js"]
  --stack-id  Optional overwriting of the stack ID declared in the config file
                                                                        [string]

Examples:
  cdk deploy --app 'aws-simple create' --profile clebert
  cdk deploy --app 'aws-simple create --stack-id stage' --profile clebert
```

### Upload files to S3

```
aws-simple upload [options]

Upload files to S3

Options:
  --version   Show version number                                      [boolean]
  -h, --help  Show help                                                [boolean]
  --config    The path to the config file
                                      [string] [default: "aws-simple.config.js"]
  --profile   The AWS profile name as set in the shared credentials file
                                                             [string] [required]
  --region    The AWS region                                 [string] [required]
  --stack-id  Optional overwriting of the stack ID declared in the config file
                                                                        [string]

Examples:
  aws-simple upload --profile clebert --region eu-central-1
  aws-simple upload --profile clebert --region eu-central-1 --stack-id stage
```

### Start local DEV server

```
aws-simple start [options]

Start local DEV server

Options:
  --version   Show version number                                      [boolean]
  -h, --help  Show help                                                [boolean]
  --config    The path to the config file
                                      [string] [default: "aws-simple.config.js"]
  --port      The port to listen on                     [number] [default: 3000]
  --cached    Enable caching of successful Lambda results per request URL
                                                      [boolean] [default: false]
  --verbose   Enable logging of successful Lambda results
                                                      [boolean] [default: false]

Examples:
  aws-simple start
  aws-simple start --port 1985 --cached
```

## Development

### Publish a New Release

```
npm version 1.0.0 && git push --follow-tags
```

After a new release has been created by pushing the tag, it must be published
via the GitHub UI. This triggers the final publication to npm.

---

Copyright (c) 2019, Clemens Akens. Released under the terms of the [MIT
License][license].

[aws-simple-example]: https://github.com/clebert/aws-simple-example
[cdk-guide]: https://docs.aws.amazon.com/cdk/latest/guide/tools.html
[ci-badge]: https://github.com/clebert/aws-simple/workflows/CI/badge.svg
[license]: https://github.com/clebert/aws-simple/blob/master/LICENSE
[stack-config-type]:
  https://github.com/clebert/aws-simple/blob/master/src/index.ts#L67
