import path from 'path';
import {StackConfig} from '..';

export interface OutputIds {
  readonly restApiUrl: string;
  readonly s3BucketName: string;
}

export interface ResourceIds {
  readonly aRecord: string;
  readonly certificate: string;
  readonly lambda: string;
  readonly restApi: string;
  readonly restApiUrlOutput: string;
  readonly s3Bucket: string;
  readonly s3BucketNameOutput: string;
  readonly s3IntegrationPolicy: string;
  readonly s3IntegrationRole: string;
  readonly stack: string;
  readonly zone: string;
}

// tslint:disable-next-line: no-any
function isStackConfig(value: any): value is StackConfig {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return typeof value.appName === 'string' && typeof value.stackId === 'string';
}

export class AppConfig {
  public static load(configFilename: string): AppConfig {
    const absoluteConfigFilename = path.resolve(configFilename);

    try {
      const stackConfig = require(absoluteConfigFilename).default;

      if (!isStackConfig(stackConfig)) {
        throw new Error(
          `The specified config file has no valid default export: ${absoluteConfigFilename}`
        );
      }

      return new AppConfig(stackConfig);
    } catch (error) {
      throw new Error(
        `The specified config file cannot be loaded: ${absoluteConfigFilename}\nCause: ${error.message}`
      );
    }
  }

  public readonly outputIds: OutputIds;
  public readonly resourceIds: ResourceIds;

  private constructor(public readonly stackConfig: StackConfig) {
    this.outputIds = {
      restApiUrl: this.getOutputId('rest-api-url'),
      s3BucketName: this.getOutputId('s3-bucket-name')
    };

    this.resourceIds = {
      aRecord: this.getResourceId('a-record'),
      certificate: this.getResourceId('certificate'),
      lambda: this.getResourceId('lambda'),
      restApi: this.getResourceId('rest-api'),
      restApiUrlOutput: this.getResourceId('rest-api-url-output'),
      s3Bucket: this.getResourceId('s3-bucket'),
      s3BucketNameOutput: this.getResourceId('s3-bucket-name-output'),
      s3IntegrationPolicy: this.getResourceId('s3-integration-policy'),
      s3IntegrationRole: this.getResourceId('s3-integration-role'),
      stack: this.getResourceId('stack'),
      zone: this.getResourceId('zone')
    };
  }

  private getOutputId(exportName: string): string {
    const {appName, stackId} = this.stackConfig;

    return `${appName}-${stackId}-output-${exportName}`;
  }

  private getResourceId(resourceName: string): string {
    const {appName, stackId} = this.stackConfig;

    return `${appName}-${stackId}-resource-${resourceName}`;
  }
}
