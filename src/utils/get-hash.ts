import {createHash} from 'crypto';

export function getHash(...values: string[]): string {
  return createHash(`sha1`)
    .update(JSON.stringify(values))
    .digest()
    .toString(`hex`)
    .slice(0, 7);
}
