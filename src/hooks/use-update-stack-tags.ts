import {useApp} from 'ink';
import React from 'react';
import {ClientConfigContext} from '../contexts/client-config-context';
import {findStack} from '../sdk/find-stack';
import type {Tag} from '../sdk/update-stack-tags';
import {updateStackTags} from '../sdk/update-stack-tags';
import {useAppConfig} from './use-app-config';

export type UpdateStackTagsHookState =
  | 'uninitialized'
  | 'initialized'
  | 'canceled';

export interface UninitializedUpdateStackTagsHook {
  readonly state: 'uninitialized';
  readonly perform: (cancel: boolean) => void;
}

export interface InitializedUpdateStackTagsHook {
  readonly state: 'initialized';
  readonly completed: boolean;
}

export interface CanceledUpdateStackTagsHook {
  readonly state: 'canceled';
}

export type UpdateStackTagsHook =
  | UninitializedUpdateStackTagsHook
  | InitializedUpdateStackTagsHook
  | CanceledUpdateStackTagsHook;

export function useUpdateStackTags(
  tagsToAdd: Tag[],
  tagsToRemove: string[],
  performImmediately: boolean,
): UpdateStackTagsHook {
  const appConfig = useAppConfig();
  const clientConfig = React.useContext(ClientConfigContext);
  const {exit} = useApp();

  const [state, setState] = React.useState<UpdateStackTagsHookState>(
    performImmediately ? `initialized` : `uninitialized`,
  );

  const perform = React.useCallback((cancel: boolean) => {
    setState((currentState) =>
      currentState === `uninitialized`
        ? cancel
          ? `canceled`
          : `initialized`
        : currentState,
    );
  }, []);

  const [completed, setCompleted] = React.useState(false);

  React.useEffect(() => {
    if (state !== `initialized`) {
      return;
    }

    (async () => {
      const stack = await findStack(appConfig, clientConfig);

      await updateStackTags(clientConfig, stack, tagsToAdd, tagsToRemove);

      setCompleted(true);
    })().catch(exit);
  }, [state]);

  return state === `uninitialized`
    ? {state, perform}
    : state === `initialized`
    ? {state, completed}
    : {state};
}
