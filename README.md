# aws-simple

Production-ready AWS website deployment with minimal configuration and
simulation using a local DEV server.

## Installation

```
npm install aws-simple aws-cdk
```

## Getting Started

The following are the steps to deploy a website using `aws-simple` and the AWS
CDK.

### 1. Create a config file

Create a config file named `aws-simple.config.js`, which exports a function that
describes a website stack:

```js
// @ts-check

/** @type {import('aws-simple').ConfigFileDefaultExport} */
exports.default = function (port) {
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
[AWS IAM policy](#aws-iam-policy) with sufficient permissions.

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

## AWS IAM Policy

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
