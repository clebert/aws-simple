import {Text, useApp} from 'ink';
import React from 'react';
import type {Argv} from 'yargs';
import {ClientConfigContext} from '../contexts/client-config-context';
import {useAppConfig} from '../hooks/use-app-config';
import {findStack} from '../sdk/find-stack';
import {redeployRestApi} from '../sdk/redeploy-rest-api';
import {Spinner} from './spinner';

export interface RedeployCommandProps {
  readonly argv: {readonly _: unknown[]};
}

interface TagArgv {
  readonly _: ['redeploy'];
}

function isRedeployArgv(argv: {readonly _: unknown[]}): argv is TagArgv {
  return argv._[0] === `redeploy`;
}

export const RedeployCommand = (
  props: RedeployCommandProps,
): JSX.Element | null => {
  if (!isRedeployArgv(props.argv)) {
    return null;
  }

  const {exit} = useApp();
  const appConfig = useAppConfig();
  const clientConfig = React.useContext(ClientConfigContext);
  const [completed, setCompleted] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const stack = await findStack(appConfig, clientConfig);

      await redeployRestApi(clientConfig, stack);

      setCompleted(true);
    })().catch(exit);
  }, []);

  return completed ? (
    <Text color="green">
      The redeployment of the REST API was completed successfully.
    </Text>
  ) : (
    <Spinner>The redeployment of the REST API is in progress.</Spinner>
  );
};

RedeployCommand.describe = (argv: Argv) =>
  argv.command(`redeploy [options]`, `Redeploy the REST API`, (commandArgv) =>
    commandArgv.example(`npx $0 redeploy`, ``),
  );
