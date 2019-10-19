import {CloudFormation} from 'aws-sdk';
import {Box, Color, Text} from 'ink';
import React from 'react';
import {Argv} from 'yargs';
import {useFindStacks} from '../hooks/use-find-stacks';
import {getAgeInDays} from '../utils/get-age-in-days';
import {plural} from '../utils/plural';
import {parseStackName} from '../utils/stack-name';
import {Spinner} from './spinner';
import {Column, Table} from './table';

export interface ListCommandProps {
  readonly argv: {readonly _: string[]};
}

interface ListArgv {
  readonly _: ['list'];
}

function isListArgv(argv: {readonly _: string[]}): argv is ListArgv {
  return argv._[0] === 'list';
}

const appVersionColumn: Column<CloudFormation.Stack, 'StackName'> = {
  headerCell: <Text underline>App Version</Text>,
  entryKey: 'StackName',
  createEntryCell: value => {
    const parts = parseStackName(value);

    return (parts && parts.appVersion) || value;
  }
};

const ageColumn: Column<CloudFormation.Stack, 'CreationTime'> = {
  headerCell: <Text underline>Age</Text>,
  entryKey: 'CreationTime',
  createEntryCell: value => {
    const ageInDays = getAgeInDays(value);

    return `${ageInDays} day${ageInDays === 1 ? '' : 's'}`;
  }
};

const tagsColumn: Column<CloudFormation.Stack, 'Tags'> = {
  headerCell: <Text underline>Tags</Text>,
  entryKey: 'Tags',
  createEntryCell: value => (value ? value.map(({Key}) => Key).join(', ') : '')
};

export const ListCommand = (props: ListCommandProps) => {
  if (!isListArgv(props.argv)) {
    return null;
  }

  const stacks = useFindStacks();

  if (!stacks) {
    return <Spinner>The search for deployed stacks is running.</Spinner>;
  }

  if (stacks.length === 0) {
    return <Color yellow>No deployed stacks found.</Color>;
  }

  return (
    <>
      <Box marginBottom={1}>
        <Color green>
          {stacks.length} deployed {plural('stack', stacks)} found.
        </Color>
      </Box>
      <Table
        columns={[appVersionColumn, ageColumn, tagsColumn]}
        entries={stacks}
      />
    </>
  );
};

ListCommand.describe = (argv: Argv) =>
  argv.command('list [options]', 'List all deployed stacks', commandArgv =>
    commandArgv.example('npx $0 list', '')
  );
