import {
  CloudFormation,
  CredentialProviderChain,
  Credentials,
  SharedIniFileCredentials
} from 'aws-sdk';

export interface SdkConfig {
  readonly profile: string;
  readonly region: string;
}

async function getCredentials(profile: string): Promise<Credentials> {
  const providers = [() => new SharedIniFileCredentials({profile})];
  const credentialProviderChain = new CredentialProviderChain(providers);

  return credentialProviderChain.resolvePromise();
}

export async function createClientConfig(
  sdkConfig: SdkConfig
): Promise<CloudFormation.ClientConfiguration> {
  const {profile, region} = sdkConfig;

  return {credentials: await getCredentials(profile), region};
}
