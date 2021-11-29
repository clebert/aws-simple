import {render} from 'ink-testing-library';
import React from 'react';
import type {Column} from './table';
import {Table} from './table';

interface TestEntry {
  readonly foo: string;
  readonly bar: string;
  readonly baz: string;
}

const fooColumn: Column<TestEntry, 'foo'> = {
  headerCell: 'Foo',
  entryKey: 'foo',
  createEntryCell: (value) => value,
};

const barColumn: Column<TestEntry, 'bar'> = {
  headerCell: '',
  entryKey: 'bar',
  createEntryCell: (value) => value,
};

const bazColumn: Column<TestEntry, 'baz'> = {
  headerCell: 'Baz',
  entryKey: 'baz',
  createEntryCell: (value) => value,
};

const columns = [fooColumn, barColumn, bazColumn];

const entries: TestEntry[] = [
  {foo: 'a1', bar: 'b1', baz: 'c1'},
  {foo: '', bar: '', baz: ''},
  {foo: '', bar: 'b2', baz: 'c2'},
  {foo: 'a3', bar: '', baz: 'c3'},
  {foo: 'a4', bar: 'b4', baz: ''},
];

describe('Table', () => {
  describe('with no columns and no entries', () => {
    it('renders no table', () => {
      const {lastFrame} = render(<Table columns={[]} entries={[]} />);

      expect(lastFrame()).toBe('');
    });
  });

  describe('with no columns but entries', () => {
    it('renders no table', () => {
      const {lastFrame} = render(<Table columns={[]} entries={entries} />);

      expect(lastFrame()).toBe('');
    });
  });

  describe('with columns and no entries', () => {
    it('renders a table with header but no entries', () => {
      const {lastFrame} = render(<Table columns={columns} entries={[]} />);

      expect(lastFrame()).toBe('Foo     Baz');
    });
  });

  describe('with columns and entries', () => {
    it('renders a table with header and entries', () => {
      const {lastFrame} = render(<Table columns={columns} entries={entries} />);

      expect(lastFrame()).toBe(
        [
          'Foo      Baz',
          'a1   b1  c1',
          '',
          '     b2  c2',
          'a3       c3',
          'a4   b4',
        ].join('\n')
      );
    });
  });
});
