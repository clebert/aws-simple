import {AppConfig} from '.';

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

function assertName(value: string, valueName: string): void {
  const regExp = /^[a-z0-9-]+$/;

  if (!regExp.test(value)) {
    throw new Error(
      `The specified ${valueName} (${value}) contains invalid characters. It should match the following pattern: ${regExp.toString()}`
    );
  }
}

export class Context {
  public readonly outputIds: OutputIds;
  public readonly resourceIds: ResourceIds;

  public constructor(
    public readonly appConfig: AppConfig,
    public readonly stackName: string = appConfig.defaultStackName
  ) {
    assertName(appConfig.appName, 'app name');
    assertName(stackName, 'stack name');

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

  public parseStackName(id: string): string {
    const {appName} = this.appConfig;
    const regExp = new RegExp(`^${appName}-(.*)-(?:output|resource)-.+`);
    const result = regExp.exec(id);

    if (!result) {
      console.warn('Unable to parse stack name from ID:', id);
    }

    return result ? result[1] : id;
  }

  private createOutputId(exportName: string): string {
    const {appName} = this.appConfig;

    return `${appName}-${this.stackName}-output-${exportName}`;
  }

  private createResourceId(resourceName: string): string {
    const {appName} = this.appConfig;

    return `${appName}-${this.stackName}-resource-${resourceName}`;
  }
}
