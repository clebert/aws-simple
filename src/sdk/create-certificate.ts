import type { StackConfig } from '../parse-stack-config.js';

import {
  ACMClient,
  DescribeCertificateCommand,
  RequestCertificateCommand,
} from '@aws-sdk/client-acm';
import {
  ChangeResourceRecordSetsCommand,
  ListHostedZonesByNameCommand,
  Route53Client,
} from '@aws-sdk/client-route-53';
import { getDomainName } from '../utils/get-domain-name.js';
import { print } from '../utils/print.js';

const MAX_RECORD_ATTEMPTS = 20;
const MAX_ISSUED_ATTEMPTS = 60;
const RECORD_POLL_INTERVAL_IN_MS = 3000;
const ISSUED_POLL_INTERVAL_IN_MS = 10000;

export async function createCertificate(stackConfig: StackConfig): Promise<string> {
  if (!stackConfig.hostedZoneName) {
    throw new Error(`A hosted zone name is required to create a DNS-validated certificate.`);
  }

  const domainName = getDomainName(stackConfig);
  const acmClient = new ACMClient({});
  const route53Client = new Route53Client({});

  print.info(`Creating ACM certificate for ${domainName}...`);

  const requestResult = await acmClient.send(
    new RequestCertificateCommand({
      DomainName: domainName,
      ValidationMethod: 'DNS',
    }),
  );

  const certificateArn = requestResult.CertificateArn;

  if (!certificateArn) {
    throw new Error(`The ACM certificate ARN cannot be found after requesting a certificate.`);
  }

  const hostedZoneId = await findHostedZoneId(route53Client, stackConfig.hostedZoneName);
  const validationRecords = await getValidationRecords(acmClient, certificateArn);

  await route53Client.send(
    new ChangeResourceRecordSetsCommand({
      HostedZoneId: hostedZoneId,
      ChangeBatch: {
        Changes: validationRecords.map((record) => ({
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: record.Name,
            Type: record.Type,
            TTL: 60,
            ResourceRecords: [{ Value: record.Value }],
          },
        })),
      },
    }),
  );

  print.info(`Waiting for ACM certificate validation...`);

  await waitForIssuedCertificate(acmClient, certificateArn);

  print.success(`Successfully created ACM certificate: ${certificateArn}`);

  return certificateArn;
}

async function findHostedZoneId(client: Route53Client, hostedZoneName: string): Promise<string> {
  const normalizedHostedZoneName = normalizeDnsName(hostedZoneName);

  const response = await client.send(
    new ListHostedZonesByNameCommand({
      DNSName: normalizedHostedZoneName,
      MaxItems: 1,
    }),
  );

  const hostedZone = response.HostedZones?.find(
    (zone) =>
      !!zone.Name &&
      normalizeDnsName(zone.Name) === normalizedHostedZoneName &&
      zone.Config?.PrivateZone !== true,
  );

  const hostedZoneId = hostedZone?.Id?.split('/').at(-1);

  if (!hostedZoneId) {
    throw new Error(`The public hosted zone cannot be found: ${hostedZoneName}`);
  }

  return hostedZoneId;
}

async function getValidationRecords(
  client: ACMClient,
  certificateArn: string,
): Promise<readonly { readonly Name: string; readonly Type: 'CNAME'; readonly Value: string }[]> {
  for (let attempt = 1; attempt <= MAX_RECORD_ATTEMPTS; attempt += 1) {
    const response = await client.send(
      new DescribeCertificateCommand({
        CertificateArn: certificateArn,
      }),
    );

    const status = response.Certificate?.Status;

    if (status === 'FAILED') {
      throw new Error(
        `ACM certificate creation failed before DNS validation records were returned.`,
      );
    }

    const records =
      response.Certificate?.DomainValidationOptions?.flatMap((option) =>
        option.ResourceRecord ? [option.ResourceRecord] : [],
      ) ?? [];

    if (records.length > 0) {
      return records
        .map((record) => {
          if (!record.Name || !record.Type || !record.Value) {
            return undefined;
          }

          if (record.Type !== 'CNAME') {
            throw new Error(`Unsupported ACM DNS validation record type: ${record.Type}`);
          }

          return { Name: record.Name, Type: 'CNAME' as const, Value: record.Value };
        })
        .filter(
          (
            record,
          ): record is { readonly Name: string; readonly Type: 'CNAME'; readonly Value: string } =>
            !!record,
        );
    }

    await sleep(RECORD_POLL_INTERVAL_IN_MS);
  }

  throw new Error(`Timed out waiting for ACM DNS validation records.`);
}

async function waitForIssuedCertificate(client: ACMClient, certificateArn: string): Promise<void> {
  for (let attempt = 1; attempt <= MAX_ISSUED_ATTEMPTS; attempt += 1) {
    const response = await client.send(
      new DescribeCertificateCommand({
        CertificateArn: certificateArn,
      }),
    );

    const status = response.Certificate?.Status;

    if (status === 'ISSUED') {
      return;
    }

    if (
      status === 'FAILED' ||
      status === 'EXPIRED' ||
      status === 'REVOKED' ||
      status === 'VALIDATION_TIMED_OUT'
    ) {
      throw new Error(`ACM certificate validation failed with status: ${status}`);
    }

    await sleep(ISSUED_POLL_INTERVAL_IN_MS);
  }

  throw new Error(`Timed out waiting for ACM certificate issuance.`);
}

function normalizeDnsName(value: string): string {
  return value.endsWith('.') ? value : `${value}.`;
}

async function sleep(durationInMs: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, durationInMs);
  });
}
