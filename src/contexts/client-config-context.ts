import {CloudFormation} from 'aws-sdk';
import React from 'react';

export const ClientConfigContext = React.createContext<
  CloudFormation.ClientConfiguration
>({});
