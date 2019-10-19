import {CloudFormation} from 'aws-sdk';
import {AppContext} from 'ink';
import React from 'react';
import {AppConfigContext} from '../contexts/app-config-context';
import {ClientConfigContext} from '../contexts/client-config-context';
import {findStack} from '../sdk/find-stack';

export function useFindStack(): CloudFormation.Stack | undefined {
  const appConfig = React.useContext(AppConfigContext);
  const clientConfig = React.useContext(ClientConfigContext);
  const {exit} = React.useContext(AppContext);
  const [stack, setStack] = React.useState<CloudFormation.Stack>();

  React.useEffect(() => {
    findStack(appConfig, clientConfig)
      .then(setStack)
      .catch(exit);
  }, [appConfig, clientConfig]);

  return stack;
}
