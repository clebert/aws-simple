import {Box, Color, Static} from 'ink';
import React from 'react';
import {AppConfig} from '../types';

export interface AppInfoProps {
  readonly appConfig: AppConfig;
}

export const AppInfo = ({appConfig}: AppInfoProps) => (
  <Static>
    {[
      <Box flexDirection="column" marginBottom={1} key="app-info">
        <Box>
          <Box marginRight={1}>
            <Color bold underline>
              App Name:
            </Color>
          </Box>
          {`${appConfig.appName}`}
        </Box>
        <Box>
          <Box marginRight={1}>
            <Color bold underline>
              App Version:
            </Color>
          </Box>
          {`${appConfig.appVersion}`}
        </Box>
      </Box>
    ]}
  </Static>
);
