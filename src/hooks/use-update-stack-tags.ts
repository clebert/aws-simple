import {AppContext} from 'ink';
import React from 'react';
import {ClientConfigContext} from '../contexts/client-config-context';
import {updateStackTags} from '../sdk/update-stack-tags';
import {useFindStack} from './use-find-stack';

export function useUpdateStackTags(
  tagsToAdd: string[],
  tagsToRemove: string[]
): boolean {
  const clientConfig = React.useContext(ClientConfigContext);
  const {exit} = React.useContext(AppContext);
  const [completed, setCompleted] = React.useState(false);
  const stack = useFindStack();

  React.useEffect(() => {
    if (!stack) {
      return;
    }

    updateStackTags(clientConfig, stack, tagsToAdd, tagsToRemove)
      .then(() => setCompleted(true))
      .catch(exit);
  }, [clientConfig, stack, tagsToAdd, tagsToRemove]);

  return completed;
}
