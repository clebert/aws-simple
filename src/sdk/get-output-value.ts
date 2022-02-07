import type {Stack} from '@aws-sdk/client-cloudformation';

export function getOutputValue(
  stack: Stack,
  outputKey: 'BucketName' | 'HostedZoneName' | 'RestApiId',
): string {
  const output = stack.Outputs?.find(
    ({OutputKey}) => OutputKey === `${outputKey}Output`,
  );

  const outputValue = output?.OutputValue;

  if (!outputValue) {
    throw new Error(`The output cannot be found: ${outputKey}`);
  }

  return outputValue;
}
