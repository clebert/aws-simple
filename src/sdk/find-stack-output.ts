import {CloudFormation} from 'aws-sdk';
import {ExportName} from '../cdk/create-resources';

export interface StackOutputs {
  readonly restApiUrl: string;
  readonly s3BucketName: string;
}

export function findStackOutput(
  stack: CloudFormation.Stack,
  exportName: ExportName
): string {
  const {StackName, Outputs} = stack;

  const output =
    Outputs && Outputs.find(Output => Output.ExportName === exportName);

  const outputValue = output && output.OutputValue;

  if (!outputValue) {
    throw new Error(
      `No output for export name (${exportName}) found in stack (${StackName}).`
    );
  }

  return outputValue;
}
