import {getHash} from './get-hash.js';
import {getNormalizedName} from './get-normalized-name.js';

export function getStackName(domainName: string): string {
  return `aws-simple-${getNormalizedName(domainName)}-${getHash(domainName)}`;
}
