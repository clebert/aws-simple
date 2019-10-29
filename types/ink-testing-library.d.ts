declare module 'ink-testing-library' {
  export interface RenderResult {
    lastFrame(): string;
  }

  export function render(element: JSX.Element): RenderResult;
}
