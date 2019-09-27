import {AppConfig} from '..';

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

export class DeploymentDescriptor {
  public readonly appName: string;
  public readonly stackName: string;
  public readonly outputIds: OutputIds;
  public readonly resourceIds: ResourceIds;

  public constructor(appConfig: AppConfig) {
    this.appName = appConfig.appName;
    this.stackName = appConfig.stackName;

    this.outputIds = {
      restApiUrl: this.createOutputId('rest-api-url'),
      s3BucketName: this.createOutputId('s3-bucket-name')
    };

    this.resourceIds = {
      aRecord: this.createResourceId('a-record'),
      certificate: this.createResourceId('certificate'),
      lambda: this.createResourceId('lambda'),
      restApi: this.createResourceId('rest-api'),
      restApiUrlOutput: this.createResourceId('rest-api-url-output'),
      s3Bucket: this.createResourceId('s3-bucket'),
      s3BucketNameOutput: this.createResourceId('s3-bucket-name-output'),
      s3IntegrationPolicy: this.createResourceId('s3-integration-policy'),
      s3IntegrationRole: this.createResourceId('s3-integration-role'),
      stack: this.createResourceId('stack'),
      zone: this.createResourceId('zone')
    };
  }

  public createOutputId(exportName: string): string {
    return `${this.appName}-${this.stackName}-output-${exportName}`;
  }

  public createResourceId(resourceName: string): string {
    return `${this.appName}-${this.stackName}-resource-${resourceName}`;
  }
}
