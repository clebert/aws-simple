import {Box, Text, useStdin} from 'ink';
import React from 'react';

export interface ConfirmProps {
  readonly children: React.ReactNode;
  readonly callback: (result: boolean) => void;
}

export const Confirm = ({
  children,
  callback,
}: ConfirmProps): JSX.Element | null => {
  const [confirmed, setConfirmed] = React.useState<boolean>();
  const {isRawModeSupported, setRawMode, stdin} = useStdin();

  React.useEffect(() => {
    if (isRawModeSupported && setRawMode) {
      setRawMode(true);
    }

    const handleData = (data: string): void => {
      const input = data.toLowerCase();

      if (input === `y` || input === `n`) {
        stdin?.off(`data`, handleData);

        const result = input === `y`;

        setConfirmed(result);
        callback(result);
      }
    };

    stdin?.on(`data`, handleData);

    return () => {
      stdin?.off(`data`, handleData);

      if (isRawModeSupported && setRawMode) {
        setRawMode(false);
      }
    };
  }, [callback]);

  return isRawModeSupported ? (
    <Box>
      <Text>{children}</Text>
      {confirmed === undefined ? (
        <Text color="yellow"> (y/n)</Text>
      ) : confirmed ? (
        <Text color="green"> yes</Text>
      ) : (
        <Text color="red"> no</Text>
      )}
    </Box>
  ) : null;
};
