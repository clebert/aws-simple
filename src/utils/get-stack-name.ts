import {getHash} from './get-hash';
import {getNormalizedName} from './get-normalized-name';

export function getStackName(domainName: string): string {
  return `aws-simple-${getNormalizedName(domainName)}-${getHash(domainName)}`;
}
