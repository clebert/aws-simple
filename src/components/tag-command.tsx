import {Color} from 'ink';
import React from 'react';
import {Argv} from 'yargs';
import {AppConfigContext} from '../contexts/app-config-context';
import {useUpdateStackTags} from '../hooks/use-update-stack-tags';
import {createStackName} from '../utils/stack-name';
import {Spinner} from './spinner';

export interface TagCommandProps {
  readonly argv: {readonly _: string[]};
}

interface TagArgv {
  readonly _: ['tag'];
  readonly add: string[];
  readonly remove: string[];
}

function isTagArgv(argv: {readonly _: string[]}): argv is TagArgv {
  return argv._[0] === 'tag';
}

export const TagCommand = (props: TagCommandProps) => {
  if (!isTagArgv(props.argv)) {
    return null;
  }

  const {argv} = props;
  const completed = useUpdateStackTags(argv.add, argv.remove);
  const appConfig = React.useContext(AppConfigContext);
  const stackName = createStackName(appConfig);

  return completed ? (
    <Color green>Successfully completed update of stack: {stackName}</Color>
  ) : (
    <Spinner>Completing update of stack: {stackName}</Spinner>
  );
};

TagCommand.describe = (argv: Argv) =>
  argv.command('tag [options]', 'Tag a deployed stack', commandArgv =>
    commandArgv
      .describe('add', 'The tags to add')
      .array('add')
      .default('add', [])

      .describe('remove', 'The tags to remove')
      .array('remove')
      .default('remove', [])

      .example('npx $0 tag --add latest release --remove prerelease', '')
  );
