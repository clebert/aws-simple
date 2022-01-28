import React from 'react';
import {AppConfigContext} from '../contexts/app-config-context';
import type {AppConfig} from '../types';

export function useAppConfig(): AppConfig {
  const appConfig = React.useContext(AppConfigContext);

  if (!appConfig) {
    throw new Error(
      `An AppConfigContext.Provider must be rendered to provide the app config.`,
    );
  }

  return appConfig;
}
