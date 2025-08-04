import type { LambdaRoute, StackConfig } from '../parse-stack-config.js';
import { type Stack, RemovalPolicy } from 'aws-cdk-lib';

import { getDomainName } from '../utils/get-domain-name.js';
import { getHash } from '../utils/get-hash.js';
import { getNormalizedName } from '../utils/get-normalized-name.js';
import { mapLambdaRuntime } from '../utils/map-lambda-runtime.js';
import { Duration, aws_ec2, aws_efs, aws_iam, aws_lambda, aws_logs } from 'aws-cdk-lib';
import { basename, dirname, extname, join } from 'path';

export interface LambdaFunctionConstructDependencies {
  readonly lambdaServiceRole: aws_iam.IRole;
  readonly stack: Stack;
}

const maxTimeoutInSeconds = 28;

export function createLambdaFunction(
  stackConfig: StackConfig,
  route: LambdaRoute,
  constructDependencies: LambdaFunctionConstructDependencies,
): aws_lambda.FunctionBase {
  const { lambdaServiceRole, stack } = constructDependencies;

  const {
    httpMethod,
    publicPath,
    path,
    functionName,
    memorySize = 128,
    timeoutInSeconds = maxTimeoutInSeconds,
    environment,
    filesystem,
  } = route;

  if (timeoutInSeconds > maxTimeoutInSeconds) {
    throw new Error(
      `The timeout of a Lambda function must be less than the maximum API gateway integration timeout of 29 seconds.`,
    );
  }

  const domainName = getDomainName(stackConfig);

  // Example: POST-foo-bar-baz-1234567
  const uniqueFunctionName = `${httpMethod}-${getNormalizedName(functionName)}-${getHash(
    functionName,
    domainName,
  )}`;

  if (uniqueFunctionName.length > 64) {
    throw new Error(
      `The unique name of a Lambda function must not be longer than 64 characters: ${uniqueFunctionName}`,
    );
  }

  const { monitoring } = stackConfig;

  const uniqueFunctionNameHash = getHash(uniqueFunctionName);

  const filesystemProps = filesystem
    ? {
        vpc: aws_ec2.Vpc.fromLookup(stack, `Vpc${uniqueFunctionNameHash}`, {
          vpcId: filesystem.vpcId,
        }),
        filesystem: aws_lambda.FileSystem.fromEfsAccessPoint(
          aws_efs.AccessPoint.fromAccessPointAttributes(
            stack,
            `AccessPoint${uniqueFunctionNameHash}`,
            {
              accessPointId: filesystem.accessPointId,
              fileSystem: aws_efs.FileSystem.fromFileSystemAttributes(
                stack,
                `FileSystem${uniqueFunctionNameHash}`,
                {
                  fileSystemId: filesystem.fileSystemId,
                  securityGroup: aws_ec2.SecurityGroup.fromSecurityGroupId(
                    stack,
                    `SecurityGroup${uniqueFunctionNameHash}`,
                    filesystem.securityGroupId,
                  ),
                },
              ),
            },
          ),
          filesystem.mountPath,
        ),
      }
    : undefined;

  const logGroup = new aws_logs.LogGroup(stack, `LogGroup${uniqueFunctionNameHash}`, {
    retention: aws_logs.RetentionDays.TWO_WEEKS,
    logGroupName: `/aws/lambda/${uniqueFunctionName}`,
    removalPolicy: RemovalPolicy.DESTROY,
  });

  const fn = new aws_lambda.Function(stack, `Function${uniqueFunctionNameHash}`, {
    functionName: uniqueFunctionName,
    code: aws_lambda.Code.fromAsset(dirname(path)),
    handler: `${basename(path, extname(path))}.handler`,
    description: `${functionName} => ${httpMethod} https://${join(domainName, publicPath)}`,
    memorySize,
    environment,
    timeout: Duration.seconds(timeoutInSeconds),
    runtime: mapLambdaRuntime(route.lambdaRuntime),
    tracing: aws_lambda.Tracing.PASS_THROUGH,
    insightsVersion:
      monitoring === true || monitoring?.lambdaInsightsEnabled
        ? aws_lambda.LambdaInsightsVersion.VERSION_1_0_229_0
        : undefined,
    logGroup,
    role: lambdaServiceRole,
    ...filesystemProps,
  });

  if (filesystem) {
    fn.addToRolePolicy(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        actions: [
          `ec2:DescribeNetworkInterfaces`,
          `ec2:CreateNetworkInterface`,
          `ec2:DeleteNetworkInterface`,
        ],
        resources: [`*`],
      }),
    );
  }

  return fn;
}
