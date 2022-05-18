import type {Describe} from 'superstruct';
import {
  array,
  boolean,
  enums,
  func,
  integer,
  literal,
  max,
  min,
  nonempty,
  object,
  optional,
  record,
  size,
  string,
  union,
  validate,
} from 'superstruct';
import type {LambdaRoute, S3Route, StackConfig} from '../stack-config.js';

export function validateStackConfig(value: unknown): StackConfig {
  const [error, stackConfig] = validate(value, stackConfigStruct);

  if (error) {
    throw new Error(`The config is invalid. ${error.message}`);
  }

  return stackConfig as any;
}

const lambdaRouteStruct: Describe<
  Omit<LambdaRoute, 'onSynthesize'> & {onSynthesize?: Function}
> = object({
  type: literal(`function`),
  httpMethod: enums([`DELETE`, `GET`, `HEAD`, `PATCH`, `POST`, `PUT`]),
  publicPath: nonempty(string()),
  path: nonempty(string()),
  functionName: nonempty(string()),
  memorySize: optional(min(integer(), 0)),
  timeoutInSeconds: optional(max(min(integer(), 0), 28)),
  environment: optional(record(nonempty(string()), nonempty(string()))),
  requestParameters: optional(
    record(
      nonempty(string()),
      object({cacheKey: optional(boolean()), required: optional(boolean())}),
    ),
  ),
  throttling: optional(
    object({rateLimit: min(integer(), 0), burstLimit: min(integer(), 0)}),
  ),
  cacheTtlInSeconds: optional(max(min(integer(), 0), 3600)),
  authenticationEnabled: optional(boolean()),
  corsEnabled: optional(boolean()),
  onSynthesize: optional(func()),
});

const s3RouteStruct: Describe<S3Route> = object({
  type: enums([`file`, `folder`]),
  httpMethod: optional(enums([`GET`])),
  publicPath: nonempty(string()),
  path: nonempty(string()),
  responseHeaders: optional(record(nonempty(string()), nonempty(string()))),
  throttling: optional(
    object({rateLimit: min(integer(), 0), burstLimit: min(integer(), 0)}),
  ),
  cacheTtlInSeconds: optional(max(min(integer(), 0), 3600)),
  authenticationEnabled: optional(boolean()),
  corsEnabled: optional(boolean()),
});

const stackConfigStruct: Describe<
  Omit<StackConfig, 'routes' | 'onSynthesize' | 'onStart'> & {
    routes: any[];
    onSynthesize?: Function;
    onStart?: Function;
  }
> = object({
  hostedZoneName: optional(nonempty(string())),
  aliasRecordName: optional(nonempty(string())),
  cachingEnabled: optional(boolean()),
  terminationProtectionEnabled: optional(boolean()),
  authentication: optional(
    object({
      username: nonempty(string()),
      password: nonempty(string()),
      realm: optional(nonempty(string())),
      cacheTtlInSeconds: optional(max(min(integer(), 0), 3600)),
    }),
  ),
  monitoring: optional(
    union([
      literal(true),
      object({
        accessLoggingEnabled: optional(boolean()),
        loggingEnabled: optional(boolean()),
        metricsEnabled: optional(boolean()),
        tracingEnabled: optional(boolean()),
      }),
    ]),
  ),
  tags: optional(record(nonempty(string()), nonempty(string()))),
  routes: size(
    array(union([lambdaRouteStruct, s3RouteStruct])),
    1,
    Number.MAX_SAFE_INTEGER,
  ),
  onSynthesize: optional(func()),
  onStart: optional(func()),
});
