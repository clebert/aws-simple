import {Box, Static, Text} from 'ink';
import React from 'react';
import type {AppConfig} from '../types';
import {Label} from './label';

export interface AppInfoProps {
  readonly appConfig: AppConfig;
}

export function AppInfo(props: AppInfoProps): JSX.Element {
  return (
    <Static items={[props.appConfig]}>
      {(appConfig) => (
        <Box flexDirection="column" marginBottom={1} key="app-info">
          <Label
            name={
              <Text bold underline>
                App Name:
              </Text>
            }
          >
            {appConfig.appName}
          </Label>
          <Label
            name={
              <Text bold underline>
                App Version:
              </Text>
            }
          >
            {appConfig.appVersion}
          </Label>
        </Box>
      )}
    </Static>
  );
}
