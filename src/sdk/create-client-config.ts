import {
  CloudFormation,
  CredentialProviderChain,
  Credentials,
  EnvironmentCredentials,
  SharedIniFileCredentials
} from 'aws-sdk';
import {Context} from '../context';

async function getCredentials(
  profile: string | undefined
): Promise<Credentials> {
  const providers = [() => new SharedIniFileCredentials({profile})];

  if (!profile) {
    providers.unshift(() => new EnvironmentCredentials('AWS'));
  }

  const credentialProviderChain = new CredentialProviderChain(providers);

  return credentialProviderChain.resolvePromise();
}

export async function createClientConfig(
  context: Context
): Promise<CloudFormation.ClientConfiguration> {
  const {region} = context.appConfig;

  return {credentials: await getCredentials(context.profile), region};
}
