import {
  CloudFormation,
  CredentialProviderChain,
  EnvironmentCredentials,
  SharedIniFileCredentials
} from 'aws-sdk';

export async function createClientConfig(): Promise<
  CloudFormation.ClientConfiguration
> {
  const credentialProviderChain = new CredentialProviderChain([
    () => new EnvironmentCredentials('AWS'), // AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
    () => new SharedIniFileCredentials()
  ]);

  return {credentials: await credentialProviderChain.resolvePromise()};
}
