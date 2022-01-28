import {createShortHash} from './create-short-hash';

export interface FunctionNameOptions {
  readonly domainName: string;
  readonly pathname: string;
}

export function getFunctionName(domainName: string, pathname: string): string {
  const normalizedDomainName = domainName.replace(/[^\w]/g, `_`);
  const normalizedPathname = pathname.replace(`/`, ``).replace(/[^\w]/g, `_`);

  return `${(normalizedPathname
    ? [normalizedDomainName, normalizedPathname].join(`-`)
    : normalizedDomainName
  ).slice(0, 57)}-${createShortHash(pathname)}`;
}
