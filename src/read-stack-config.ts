import type {Stack, aws_apigateway, aws_lambda} from 'aws-cdk-lib';
import type {Express} from 'express';

import {validateRoutes} from './utils/validate-routes.js';
import {resolve} from 'path';
import {pathToFileURL} from 'url';
import {z} from 'zod';

export type StackConfig = Omit<
  z.TypeOf<typeof StackConfigSchema>,
  'routes' | 'onSynthesize' | 'onStart'
> & {
  readonly routes: Route[];

  readonly onSynthesize?: (constructs: {
    readonly stack: Stack;
    readonly restApi: aws_apigateway.RestApiBase;
  }) => void;

  readonly onStart?: (app: Express) => void;
};

export type Route = LambdaRoute | S3Route;

export type LambdaRoute = Omit<
  z.TypeOf<typeof LambdaRouteSchema>,
  'onSynthesize'
> & {
  readonly onSynthesize?: (constructs: {
    readonly stack: Stack;
    readonly restApi: aws_apigateway.RestApiBase;
    readonly lambdaFunction: aws_lambda.FunctionBase;
  }) => void;
};

export type S3Route = z.TypeOf<typeof S3RouteSchema>;

const LambdaRouteSchema = z.object({
  type: z.literal(`function`),
  httpMethod: z.enum([`DELETE`, `GET`, `HEAD`, `PATCH`, `POST`, `PUT`]),
  publicPath: z.string(),
  path: z.string(),
  functionName: z.string(),
  memorySize: z.number().optional(),
  timeoutInSeconds: z.number().int().min(0).max(28).optional(),
  environment: z.record(z.string()).optional(),
  requestParameters: z
    .record(
      z.object({
        cacheKey: z.boolean().optional(),
        required: z.boolean().optional(),
      }),
    )
    .optional(),
  throttling: z
    .object({rateLimit: z.number(), burstLimit: z.number()})
    .optional(),
  cacheTtlInSeconds: z.number().int().min(0).max(3600).optional(),
  authenticationEnabled: z.boolean().optional(),
  corsEnabled: z.boolean().optional(),
  onSynthesize: z.function().optional(),
  debugPort: z.number().optional(),
});

const S3RouteSchema = z.object({
  type: z.enum([`file`, `folder`]),
  httpMethod: z.literal(`GET`).optional(),
  publicPath: z.string(),
  path: z.string(),
  responseHeaders: z.record(z.string()).optional(),
  throttling: z
    .object({rateLimit: z.number(), burstLimit: z.number()})
    .optional(),
  cacheTtlInSeconds: z.number().int().min(0).max(3600).optional(),
  authenticationEnabled: z.boolean().optional(),
  corsEnabled: z.boolean().optional(),
});

const StackConfigSchema = z.object({
  hostedZoneName: z.string().optional(),
  aliasRecordName: z.string().optional(),
  cachingEnabled: z.boolean().optional(),
  certificateArn: z.string().optional(),
  terminationProtectionEnabled: z.boolean().optional(),
  authentication: z
    .object({
      username: z.string(),
      password: z.string(),
      realm: z.string().optional(),
      cacheTtlInSeconds: z.number().int().min(0).max(3600).optional(),
    })
    .optional(),
  monitoring: z
    .union([
      z.literal(true),
      z.object({
        accessLoggingEnabled: z.boolean().optional(),
        loggingEnabled: z.boolean().optional(),
        metricsEnabled: z.boolean().optional(),
        tracingEnabled: z.boolean().optional(),
      }),
    ])
    .optional(),
  tags: z.record(z.string()).optional(),
  routes: z.array(z.union([LambdaRouteSchema, S3RouteSchema])).min(1),
  onSynthesize: z.function().optional(),
  onStart: z.function().optional(),
});

export async function readStackConfig(port?: number): Promise<StackConfig> {
  let module;

  const path = resolve(`aws-simple.config.mjs`);

  try {
    module = await import(pathToFileURL(path).href);
  } catch (error) {
    console.error(error);
    throw new Error(`The config file cannot be read: ${path}`);
  }

  if (typeof module.default !== `function`) {
    throw new Error(
      `The config file does not have a valid default export: ${path}`,
    );
  }

  const stackConfig = StackConfigSchema.parse(module.default(port));

  validateRoutes(stackConfig.routes);

  return stackConfig;
}
