import {RemovalPolicy} from 'aws-cdk-lib';
import type {Stack} from 'aws-cdk-lib';
import type {ILogGroup} from 'aws-cdk-lib/aws-logs';
import {LogGroup, RetentionDays} from 'aws-cdk-lib/aws-logs';

export interface AccessLogGroupInit {
  readonly stack: Stack;
  readonly domainName: string;
}

export function createAccessLogGroup(init: AccessLogGroupInit): ILogGroup {
  const {stack, domainName} = init;

  return new LogGroup(stack, `AccessLogGroup`, {
    logGroupName: `/aws/apigateway/accessLogs/${domainName}}`,
    retention: RetentionDays.TWO_WEEKS, // TODO: make configurable
    removalPolicy: RemovalPolicy.DESTROY,
  });
}
