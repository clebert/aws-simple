import {Box, Text} from 'ink';
import React from 'react';

export interface SpinnerProps {
  readonly name: React.ReactNode;
  readonly children: React.ReactNode;
}

export const Label = ({name, children}: SpinnerProps): JSX.Element => (
  <Box>
    <Box marginRight={1}>{name}</Box>
    <Text>{children}</Text>
  </Box>
);
