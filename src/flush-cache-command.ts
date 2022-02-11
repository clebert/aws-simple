import type yargs from 'yargs';
import {readStackConfig} from './read-stack-config';
import {findStack} from './sdk/find-stack';
import {flushRestApiCache} from './sdk/flush-rest-api-cache';
import {getOutputValue} from './sdk/get-output-value';
import {getDomainName} from './utils/get-domain-name';
import {getStackName} from './utils/get-stack-name';
import {print} from './utils/print';

export interface FlushCacheCommandArgs {
  readonly stackName: string | undefined;
  readonly yes: boolean;
}

const commandName = `flush-cache`;

const builder: yargs.BuilderCallback<{}, {}> = (argv) =>
  argv
    .describe(
      `stack-name`,
      `An optional stack name, if not specified it will be determined from the config file`,
    )
    .string(`stack-name`)

    .describe(`yes`, `Confirm the flushing of the REST API cache automatically`)
    .boolean(`yes`)
    .default(`yes`, false)

    .example(`npx $0 ${commandName}`, ``)
    .example(
      `npx $0 ${commandName} --stack-name aws-simple-example-com-1234567`,
      ``,
    )
    .example(`npx $0 ${commandName} --yes`, ``);

export async function flushCacheCommand(
  args: FlushCacheCommandArgs,
): Promise<void> {
  const stackName =
    args.stackName || getStackName(getDomainName(readStackConfig()));

  print.warning(`Stack: ${stackName}`);

  if (args.yes) {
    print.warning(
      `The REST API cache of the specified stack will be flushed automatically.`,
    );
  } else {
    const confirmed = await print.confirmation(
      `Confirm to flush the REST API cache of the specified stack.`,
    );

    if (!confirmed) {
      return;
    }
  }

  print.info(`Flushing the REST API cache...`);

  const stack = await findStack(stackName);
  const restApiId = getOutputValue(stack, `RestApiId`);

  if (!restApiId) {
    throw new Error(`The REST API cannot be found.`);
  }

  await flushRestApiCache(restApiId);

  print.success(`The REST API cache has been successfully flushed.`);
}

flushCacheCommand.commandName = commandName;
flushCacheCommand.description = `Flush the REST API cache of the specified stack.`;
flushCacheCommand.builder = builder;
