import type {CommandModule} from 'yargs';

import {addLambdaResource} from './cdk/add-lambda-resource.js';
import {addS3Resource} from './cdk/add-s3-resource.js';
import {createBucketReadRole} from './cdk/create-bucket-read-role.js';
import {createBucket} from './cdk/create-bucket.js';
import {createRequestAuthorizer} from './cdk/create-request-authorizer.js';
import {createRestApi} from './cdk/create-rest-api.js';
import {createStack} from './cdk/create-stack.js';
import {parseStackConfig} from './parse-stack-config.js';
import {readStackConfig} from './read-stack-config.js';

const commandName = `synthesize`;

export const synthesizeCommand: CommandModule<{}, {}> = {
  command: `${commandName} [options]`,
  aliases: [`synth`],
  describe: `Synthesize the configured stack using the CDK.`,

  builder: (argv) =>
    argv.example([
      [`npx cdk bootstrap --app 'npx $0 ${commandName}'`],
      [`npx cdk deploy --app 'npx $0 ${commandName}'`],
      [`npx cdk diff --app 'npx $0 ${commandName}'`],
    ]),

  handler: async (): Promise<void> => {
    const stackConfig = parseStackConfig(await readStackConfig());
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
        addS3Resource(
          route,
          restApi,
          bucket,
          bucketReadRole,
          requestAuthorizer,
        );
      }
    }

    stackConfig.onSynthesize?.({stack, restApi});
  },
};
