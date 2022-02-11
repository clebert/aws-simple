// redeploy-command.ts

import type yargs from 'yargs';
import {readStackConfig} from './read-stack-config';
import {findStack} from './sdk/find-stack';
import {getOutputValue} from './sdk/get-output-value';
import {redeployRestApi} from './sdk/redeploy-rest-api';
import {getDomainName} from './utils/get-domain-name';
import {getStackName} from './utils/get-stack-name';
import {print} from './utils/print';

export interface RedeployCommandArgs {
  readonly stackName: string | undefined;
  readonly yes: boolean;
}

const commandName = `redeploy`;

const builder: yargs.BuilderCallback<{}, {}> = (argv) =>
  argv
    .describe(
      `stack-name`,
      `An optional stack name, if not specified it will be determined from the config file`,
    )
    .string(`stack-name`)

    .describe(`yes`, `Confirm the redeployment of the REST API automatically`)
    .boolean(`yes`)
    .default(`yes`, false)

    .example(`npx $0 ${commandName}`, ``)
    .example(
      `npx $0 ${commandName} --stack-name aws-simple-example-com-1234567`,
      ``,
    )
    .example(`npx $0 ${commandName} --yes`, ``);

export async function redeployCommand(
  args: RedeployCommandArgs,
): Promise<void> {
  const stackName =
    args.stackName || getStackName(getDomainName(readStackConfig()));

  print.warning(`Stack: ${stackName}`);

  if (args.yes) {
    print.warning(
      `The REST API of the specified stack will be redeployed automatically.`,
    );
  } else {
    const confirmed = await print.confirmation(
      `Confirm to redeploy the REST API of the specified stack.`,
    );

    if (!confirmed) {
      return;
    }
  }

  print.info(`Redeploying the REST API...`);

  const stack = await findStack(stackName);
  const restApiId = getOutputValue(stack, `RestApiId`);

  if (!restApiId) {
    throw new Error(`The REST API cannot be found.`);
  }

  await redeployRestApi(restApiId);

  print.success(`The REST API has been successfully redeployed.`);
}

redeployCommand.commandName = commandName;
redeployCommand.description = `Redeploy the REST API of the specified stack.`;
redeployCommand.builder = builder;
