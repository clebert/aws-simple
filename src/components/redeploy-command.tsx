import {Text, useApp} from 'ink';
import React from 'react';
import {Argv} from 'yargs';
import {AppConfigContext} from '../contexts/app-config-context';
import {ClientConfigContext} from '../contexts/client-config-context';
import {findStack} from '../sdk/find-stack';
import {redeployApiGateway} from '../sdk/redeploy-api-gateway';
import {Spinner} from './spinner';

export interface RedeployCommandProps {
  readonly argv: {readonly _: string[]};
}

interface TagArgv {
  readonly _: ['redeploy'];
}

function isRedeployArgv(argv: {readonly _: string[]}): argv is TagArgv {
  return argv._[0] === 'redeploy';
}

export const RedeployCommand = (
  props: RedeployCommandProps
): JSX.Element | null => {
  if (!isRedeployArgv(props.argv)) {
    return null;
  }

  const {exit} = useApp();
  const appConfig = React.useContext(AppConfigContext);
  const clientConfig = React.useContext(ClientConfigContext);
  const [completed, setCompleted] = React.useState(false);

  React.useEffect(() => {
    (async () => {
      const stack = await findStack(appConfig, clientConfig);

      await redeployApiGateway(clientConfig, stack);

      setCompleted(true);
    })().catch(exit);
  }, []);

  return completed ? (
    <Text color="green">
      The redeployment of the API Gateway was completed successfully.
    </Text>
  ) : (
    <Spinner>The redeployment of the API Gateway is in progress.</Spinner>
  );
};

RedeployCommand.describe = (argv: Argv) =>
  argv.command(
    'redeploy [options]',
    'Redeploy the API Gateway',
    (commandArgv) => commandArgv.example('npx $0 redeploy', '')
  );
