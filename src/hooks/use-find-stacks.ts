import {CloudFormation} from 'aws-sdk';
import {AppContext} from 'ink';
import React from 'react';
import {AppConfigContext} from '../contexts/app-config-context';
import {ClientConfigContext} from '../contexts/client-config-context';
import {findStacks} from '../sdk/find-stacks';

export function useFindStacks(): CloudFormation.Stack[] | undefined {
  const appConfig = React.useContext(AppConfigContext);
  const clientConfig = React.useContext(ClientConfigContext);
  const {exit} = React.useContext(AppContext);
  const [stacks, setStacks] = React.useState<CloudFormation.Stack[]>();

  React.useEffect(() => {
    findStacks(appConfig, clientConfig)
      .then(setStacks)
      .catch(exit);
  }, [appConfig, exit]);

  return stacks;
}
