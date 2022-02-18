import type {CommandModule} from 'yargs';
import {readStackConfig} from './read-stack-config';
import {findStack} from './sdk/find-stack';
import {getOutputValue} from './sdk/get-output-value';
import {redeployRestApi} from './sdk/redeploy-rest-api';
import {getDomainName} from './utils/get-domain-name';
import {getStackName} from './utils/get-stack-name';
import {print} from './utils/print';

const commandName = `redeploy`;

export const redeployCommand: CommandModule<
  {},
  {readonly 'stack-name': string | undefined; readonly 'yes': boolean}
> = {
  command: `${commandName} [options]`,
  describe: `Redeploy the REST API of the specified stack.`,

  builder: (argv) =>
    argv
      .options(`stack-name`, {
        describe: `An optional stack name, if not specified it will be determined from the config file`,
        string: true,
      })
      .options(`yes`, {
        describe: `Confirm the redeployment of the REST API automatically`,
        boolean: true,
        default: false,
      })
      .example([
        [`npx $0 ${commandName}`],
        [`npx $0 ${commandName} --stack-name ${getStackName(`example.com`)}`],
        [`npx $0 ${commandName} --yes`],
      ]),

  handler: async (args): Promise<void> => {
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
  },
};
