import {CloudFormation} from 'aws-sdk';
import {AppContext} from 'ink';
import React from 'react';
import {AppConfigContext} from '../contexts/app-config-context';
import {ClientConfigContext} from '../contexts/client-config-context';
import {findStacks} from '../sdk/find-stacks';
import {StackExpirationCriteria, isStackExpired} from '../sdk/is-stack-expired';

export function useFindStacks(
  criteria?: StackExpirationCriteria
): CloudFormation.Stack[] | undefined {
  const appConfig = React.useContext(AppConfigContext);
  const clientConfig = React.useContext(ClientConfigContext);
  const {exit} = React.useContext(AppContext);
  const [stacks, setStacks] = React.useState<CloudFormation.Stack[]>();

  React.useEffect(() => {
    findStacks(appConfig, clientConfig)
      .then(setStacks)
      .catch(exit);
  }, [appConfig, exit]);

  return React.useMemo(
    () =>
      criteria
        ? stacks && stacks.filter(stack => isStackExpired(criteria, stack))
        : stacks,
    [criteria, stacks]
  );
}
