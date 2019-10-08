import {
  CloudFormation,
  CredentialProviderChain,
  Credentials,
  SharedIniFileCredentials
} from 'aws-sdk';

async function getCredentials(profile: string): Promise<Credentials> {
  const providers = [() => new SharedIniFileCredentials({profile})];
  const credentialProviderChain = new CredentialProviderChain(providers);

  return credentialProviderChain.resolvePromise();
}

export async function createClientConfig(
  profile: string,
  region: string
): Promise<CloudFormation.ClientConfiguration> {
  return {credentials: await getCredentials(profile), region};
}
