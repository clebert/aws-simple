import type {StackConfig} from '../get-stack-config';

export function getAbsoluteDomainName(stackConfig: StackConfig): string {
  const {domainName, subdomainName} = stackConfig;

  return subdomainName ? `${subdomainName}.${domainName}` : domainName;
}
