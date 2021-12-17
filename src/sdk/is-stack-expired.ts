import type {CloudFormation} from 'aws-sdk';
import {getAgeInDays} from '../utils/get-age-in-days';

export function isStackExpired(
  stack: CloudFormation.Stack,
  minAgeInDays: number,
  excludedTags: string[],
): boolean {
  const {CreationTime, Tags = []} = stack;

  return (
    getAgeInDays(CreationTime) >= minAgeInDays &&
    Tags.every(({Key}) => !excludedTags.includes(Key))
  );
}
