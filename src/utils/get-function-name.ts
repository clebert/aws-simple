import type {FunctionMethod} from '../new-types';
import {createShortHash} from './create-short-hash';

export interface FunctionNameOptions {
  readonly domainName: string;
  readonly pathname: string;
}

export function getFunctionName(
  domainName: string,
  pathname: string,
  method: FunctionMethod,
): string {
  const normalizedDomainName = domainName.replace(/[^\w]/g, `_`);
  const normalizedPathname = pathname.replace(`/`, ``).replace(/[^\w]/g, `_`);

  return `${method}-${(normalizedPathname
    ? [normalizedDomainName, normalizedPathname].join(`-`)
    : normalizedDomainName
  ).slice(0, 56 - (method.length + 1))}-${createShortHash(pathname)}`;
}
