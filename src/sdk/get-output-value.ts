import type {Stack} from '@aws-sdk/client-cloudformation';

export function getOutputValue(
  stack: Stack,
  outputKey: 'BucketName' | 'HostedZoneName' | 'RestApiId',
): string | undefined {
  const output = stack.Outputs?.find(({OutputKey}) => OutputKey === `${outputKey}Output`);

  return output?.OutputValue;
}
