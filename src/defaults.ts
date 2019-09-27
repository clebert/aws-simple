export interface Defaults {
  readonly configFilename: string;
  readonly lambdaHandler: string;
  readonly lambdaMemorySize: number;
  readonly lambdaTimeoutInSeconds: number;
}

export const defaults: Defaults = {
  configFilename: 'aws-simple.config.js',
  lambdaHandler: 'handler',
  lambdaMemorySize: 3008,
  lambdaTimeoutInSeconds: 30
};
