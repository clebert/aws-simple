import type {CloudFormation} from 'aws-sdk';
import {Box, Text} from 'ink';
import React from 'react';
import type {Argv} from 'yargs';
import {useFindStacks} from '../hooks/use-find-stacks';
import {getAgeInDays} from '../utils/get-age-in-days';
import {plural} from '../utils/plural';
import {parseStackName} from '../utils/stack-name';
import {Spinner} from './spinner';
import type {Column} from './table';
import {Table} from './table';

export interface ListCommandProps {
  readonly argv: {readonly _: unknown[]};
}

interface ListArgv {
  readonly _: ['list'];
}

function isListArgv(argv: {readonly _: unknown[]}): argv is ListArgv {
  return argv._[0] === `list`;
}

const appVersionColumn: Column<CloudFormation.Stack, 'StackName'> = {
  headerCell: <Text underline>App Version</Text>,
  entryKey: `StackName`,
  createEntryCell: (value) => {
    const parts = parseStackName(value);

    return (parts && parts.appVersion) || value;
  },
};

const ageColumn: Column<CloudFormation.Stack, 'CreationTime'> = {
  headerCell: <Text underline>Age</Text>,
  entryKey: `CreationTime`,
  createEntryCell: (value) => {
    const ageInDays = getAgeInDays(value);

    return `${ageInDays} day${ageInDays === 1 ? `` : `s`}`;
  },
};

const tagsColumn: Column<CloudFormation.Stack, 'Tags'> = {
  headerCell: <Text underline>Tags</Text>,
  entryKey: `Tags`,
  createEntryCell: (value) =>
    value
      ? value
          .map(({Key, Value}) => `${Key}=${JSON.stringify(Value)}`)
          .join(`, `)
      : ``,
};

export const ListCommand = (props: ListCommandProps): JSX.Element | null => {
  if (!isListArgv(props.argv)) {
    return null;
  }

  const stacks = useFindStacks();

  if (!stacks) {
    return <Spinner>The search for deployed stacks is running.</Spinner>;
  }

  if (stacks.length === 0) {
    return <Text color="yellow">No deployed stacks found.</Text>;
  }

  return (
    <>
      <Box marginBottom={1}>
        <Text color="green">
          {stacks.length} deployed {plural(`stack`, stacks)} found.
        </Text>
      </Box>
      <Table
        columns={[appVersionColumn, ageColumn, tagsColumn]}
        entries={stacks}
      />
    </>
  );
};

ListCommand.describe = (argv: Argv) =>
  argv.command(`list [options]`, `List all deployed stacks`, (commandArgv) =>
    commandArgv.example(`npx $0 list`, ``)
  );
