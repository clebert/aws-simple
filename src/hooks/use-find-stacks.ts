import type {CloudFormation} from 'aws-sdk';
import {useApp} from 'ink';
import React from 'react';
import {ClientConfigContext} from '../contexts/client-config-context';
import {findStacks} from '../sdk/find-stacks';
import {useAppConfig} from './use-app-config';

export function useFindStacks(): CloudFormation.Stack[] | undefined {
  const appConfig = useAppConfig();
  const clientConfig = React.useContext(ClientConfigContext);
  const {exit} = useApp();
  const [stacks, setStacks] = React.useState<CloudFormation.Stack[]>();

  React.useEffect(() => {
    findStacks(appConfig, clientConfig).then(setStacks).catch(exit);
  }, [appConfig, clientConfig]);

  return stacks;
}
