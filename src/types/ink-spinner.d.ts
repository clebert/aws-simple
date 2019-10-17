declare module 'ink-spinner' {
  import * as React from 'react';

  interface SpinnerProps {
    /**
     * https://github.com/sindresorhus/cli-spinners/blob/master/spinners.json
     */
    readonly type:
      | 'dots'
      | 'bouncingBar'
      | 'growVertical'
      | 'bouncingBall'
      | 'toggle3'
      | 'toggle9'
      | 'point';
  }

  const Spinner: React.FunctionComponent<SpinnerProps>;

  export = Spinner;
}
