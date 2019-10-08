declare module 'cliui' {
  interface Column {
    readonly text?: string;
    readonly width?: number;
    readonly align?: 'right' | 'center';
    /** [top, right, bottom, left] */
    readonly padding?: [number, number, number, number];
    readonly border?: boolean;
  }

  interface Ui {
    div(...columns: (string | Column)[]): void;
  }

  interface UiOptions {
    readonly width?: number;
    readonly wrap?: boolean;
  }

  const createUi: (options?: UiOptions) => Ui;

  export = createUi;
}
