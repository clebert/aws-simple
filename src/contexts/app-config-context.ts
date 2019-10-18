import React from 'react';
import {AppConfig} from '../types';

export const AppConfigContext = React.createContext<AppConfig>({
  appName: 'unknown',
  appVersion: 'unknown',
  createStackConfig: () => ({})
});
