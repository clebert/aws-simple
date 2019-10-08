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
  const {outputIds} = context;

  return {
    restApiUrl: getStackOutput(stack, outputIds.restApiUrl),
    s3BucketName: getStackOutput(stack, outputIds.s3BucketName)
  };
}
