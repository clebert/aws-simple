import {Color} from 'ink';
import React from 'react';
import {Argv} from 'yargs';
import {useUpdateStackTags} from '../hooks/use-update-stack-tags';
import {Confirm} from './confirm';
import {Spinner} from './spinner';

export interface TagCommandProps {
  readonly argv: {readonly _: string[]};
}

interface TagArgv {
  readonly _: ['tag'];
  readonly add: string[];
  readonly remove: string[];
  readonly yes: boolean;
}

function isTagArgv(argv: {readonly _: string[]}): argv is TagArgv {
  return argv._[0] === 'tag';
}

export const TagCommand = (props: TagCommandProps) => {
  if (!isTagArgv(props.argv)) {
    return null;
  }

  const {
    argv: {add, remove, yes}
  } = props;

  const updateStackTagsHook = useUpdateStackTags(add, remove, yes);

  if (updateStackTagsHook.state === 'uninitialized') {
    return (
      <Confirm callback={result => updateStackTagsHook.perform(!result)}>
        Should the stack update be performed?
      </Confirm>
    );
  }

  if (updateStackTagsHook.state === 'canceled') {
    return <Color yellow>The stack update was canceled.</Color>;
  }

  return updateStackTagsHook.completed ? (
    <Color green>The stack update was completed successfully.</Color>
  ) : (
    <Spinner>The stack update is in progress.</Spinner>
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

      .describe(
        'yes',
        'The confirmation message will automatically be answered with yes'
      )
      .boolean('yes')
      .default('yes', false)

      .example('npx $0 tag --add latest release --remove prerelease', '')
      .example('npx $0 tag --add prerelease --yes', '')
  );
