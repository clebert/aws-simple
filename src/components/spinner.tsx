import InkSpinner from 'ink-spinner';
import React from 'react';
import {Label} from './label';

export interface SpinnerProps {
  readonly children: React.ReactNode;
}

export const Spinner = ({children}: SpinnerProps): JSX.Element => (
  <Label name={<InkSpinner type={`dots`} />}>{children}</Label>
);
