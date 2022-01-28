import React from 'react';
import type {AppConfig} from '../types';

export const AppConfigContext = React.createContext<AppConfig | undefined>(
  undefined,
);
