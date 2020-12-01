import {Box, Text} from 'ink';
import React from 'react';

export interface Column<TEntry extends object, TEntryKey extends keyof TEntry> {
  readonly headerCell?: React.ReactNode;
  readonly entryKey: TEntryKey;
  readonly createEntryCell?: (value: TEntry[TEntryKey]) => React.ReactNode;
}

export interface TableProps<TEntry extends object> {
  readonly columns: Column<TEntry, any>[];
  readonly entries: TEntry[];
}

export const Table = <TEntry extends object>({
  columns,
  entries,
}: TableProps<TEntry>): JSX.Element | null =>
  columns.length > 0 ? (
    <Box width="100%" flexDirection="row">
      {columns.map(({headerCell, entryKey, createEntryCell}, columnIndex) => (
        <Box
          key={columnIndex}
          flexDirection="column"
          marginRight={columnIndex < columns.length - 1 ? 2 : 0}
        >
          <Text wrap="truncate">{headerCell || ' '}</Text>
          {entries.map((entry: any, entryIndex) => {
            const value = createEntryCell && createEntryCell(entry[entryKey]);

            return (
              <Text key={entryIndex} wrap="truncate">
                {value || ' '}
              </Text>
            );
          })}
        </Box>
      ))}
    </Box>
  ) : null;
