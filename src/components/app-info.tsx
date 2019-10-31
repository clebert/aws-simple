import {Box, Color, Static} from 'ink';
import React from 'react';
import {AppConfig} from '../types';
import {Label} from './label';

export interface AppInfoProps {
  readonly appConfig: AppConfig;
}

export const AppInfo = ({appConfig}: AppInfoProps): JSX.Element => (
  <Static>
    {[
      <Box flexDirection="column" marginBottom={1} key="app-info">
        <Label
          name={
            <Color bold underline>
              App Name:
            </Color>
          }
        >
          {appConfig.appName}
        </Label>
        <Label
          name={
            <Color bold underline>
              App Version:
            </Color>
          }
        >
          {appConfig.appVersion}
        </Label>
      </Box>
    ]}
  </Static>
);
