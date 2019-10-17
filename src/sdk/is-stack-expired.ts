import {CloudFormation} from 'aws-sdk';
import {getAgeInDays} from '../utils/get-age-in-days';

export interface StackExpirationCriteria {
  readonly maxAgeInDays: number;
  readonly tagsToPreserve: string[];
}

export function isStackExpired(
  criteria: StackExpirationCriteria,
  stack: CloudFormation.Stack
): boolean {
  const {maxAgeInDays, tagsToPreserve} = criteria;
  const {CreationTime, Tags = []} = stack;

  return (
    getAgeInDays(CreationTime) > maxAgeInDays &&
    !Tags.some(({Key}) => tagsToPreserve.some(tag => tag === Key))
  );
}
