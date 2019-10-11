import {CloudFormation} from 'aws-sdk';
import {Context} from '../context';

export interface StackOutputs {
  readonly restApiUrl: string;
  readonly s3BucketName: string;
}

function getStackOutput(
  stack: CloudFormation.Stack,
  exportName: string
): string {
  const output =
    stack.Outputs &&
    stack.Outputs.find(({ExportName}) => ExportName === exportName);

  const outputValue = output && output.OutputValue;

  if (!outputValue) {
    throw new Error(`Stack output not found: ${exportName}`);
  }

  return outputValue;
}

export function getStackOutputs(
  context: Context,
  stack: CloudFormation.Stack
): StackOutputs {
  return {
    restApiUrl: getStackOutput(stack, context.getOutputId('rest-api-url')),
    s3BucketName: getStackOutput(stack, context.getOutputId('s3-bucket-name'))
  };
}
