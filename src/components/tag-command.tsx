import {Text} from 'ink';
import React from 'react';
import {Argv} from 'yargs';
import {useUpdateStackTags} from '../hooks/use-update-stack-tags';
import {Confirm} from './confirm';
import {Spinner} from './spinner';

export interface TagCommandProps {
  readonly argv: {readonly _: unknown[]};
}

interface TagArgv {
  readonly _: ['tag'];
  readonly add: string[];
  readonly remove: string[];
  readonly yes: boolean;
}

function isTagArgv(argv: {readonly _: unknown[]}): argv is TagArgv {
  return argv._[0] === 'tag';
}

export const TagCommand = (props: TagCommandProps): JSX.Element | null => {
  if (!isTagArgv(props.argv)) {
    return null;
  }

  const {
    argv: {add, remove, yes},
  } = props;

  const updateStackTagsHook = useUpdateStackTags(add, remove, yes);

  if (updateStackTagsHook.state === 'uninitialized') {
    return (
      <Confirm callback={(result) => updateStackTagsHook.perform(!result)}>
        Should the stack update be performed?
      </Confirm>
    );
  }

  if (updateStackTagsHook.state === 'canceled') {
    return <Text color="yellow">The stack update was canceled.</Text>;
  }

  return updateStackTagsHook.completed ? (
    <Text color="green">The stack update was completed successfully.</Text>
  ) : (
    <Spinner>The stack update is in progress.</Spinner>
  );
};

TagCommand.describe = (argv: Argv) =>
  argv.command('tag [options]', 'Tag a deployed stack', (commandArgv) =>
    commandArgv
      .describe('add', 'The tags to add')
      .array('add')
      .default('add', [])

      .describe('remove', 'The tags to remove')
      .array('remove')
      .default('remove', [])

      .describe(
        'yes',
        'The confirmation message will automatically be answered with yes'
      )
      .boolean('yes')
      .default('yes', false)

      .example('npx $0 tag --add latest release --remove prerelease', '')
      .example('npx $0 tag --add prerelease --yes', '')
  );
