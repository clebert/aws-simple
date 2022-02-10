import type yargs from 'yargs';
import {addLambdaResource} from './cdk/add-lambda-resource';
import {addS3Resource} from './cdk/add-s3-resource';
import {createBucket} from './cdk/create-bucket';
import {createBucketReadRole} from './cdk/create-bucket-read-role';
import {createRequestAuthorizer} from './cdk/create-request-authorizer';
import {createRestApi} from './cdk/create-rest-api';
import {createStack} from './cdk/create-stack';
import {readStackConfig} from './read-stack-config';

const commandName = `synthesize`;

const builder: yargs.BuilderCallback<{}, {}> = (argv) =>
  argv
    .example(`npx cdk bootstrap --app 'npx $0 ${commandName}'`, ``)
    .example(`npx cdk deploy --app 'npx $0 ${commandName}'`, ``)
    .example(`npx cdk diff --app 'npx $0 ${commandName}'`, ``);

export function synthesizeCommand(): void {
  const stackConfig = readStackConfig();
  const stack = createStack(stackConfig);
  const restApi = createRestApi(stackConfig, stack);
  const bucket = createBucket(stack);
  const bucketReadRole = createBucketReadRole(stack, bucket);
  const requestAuthorizer = createRequestAuthorizer(stackConfig, stack);

  for (const route of stackConfig.routes) {
    if (route.type === `function`) {
      const lambdaFunction = addLambdaResource(
        stackConfig,
        route,
        stack,
        restApi,
        requestAuthorizer,
      );

      route.onSynthesize?.({stack, restApi, lambdaFunction});
    } else {
      addS3Resource(route, restApi, bucket, bucketReadRole, requestAuthorizer);
    }
  }

  stackConfig.onSynthesize?.({stack, restApi});
}

synthesizeCommand.commandName = commandName;
synthesizeCommand.description = `Synthesize the configured stack using the CDK.`;
synthesizeCommand.builder = builder;
