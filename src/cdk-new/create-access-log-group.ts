import type {ILogGroup} from 'aws-cdk-lib/aws-logs';
import {LogGroup, RetentionDays} from 'aws-cdk-lib/aws-logs';
import type {Stack} from 'aws-cdk-lib/core';
import {RemovalPolicy} from 'aws-cdk-lib/core';

export interface AccessLogGroupInit {
  readonly stack: Stack;
  readonly domainName: string;
}

export function createAccessLogGroup(init: AccessLogGroupInit): ILogGroup {
  const {stack, domainName} = init;

  return new LogGroup(stack, `AccessLogGroup`, {
    logGroupName: `/aws/apigateway/accessLogs/${domainName}}`,
    retention: RetentionDays.TWO_WEEKS,
    removalPolicy: RemovalPolicy.DESTROY,
  });
}
