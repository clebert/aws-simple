import type {CommandModule} from 'yargs';

import {readStackConfig} from './read-stack-config.js';
import {findStack} from './sdk/find-stack.js';
import {flushRestApiCache} from './sdk/flush-rest-api-cache.js';
import {getOutputValue} from './sdk/get-output-value.js';
import {getDomainName} from './utils/get-domain-name.js';
import {getStackName} from './utils/get-stack-name.js';
import {print} from './utils/print.js';

const commandName = `flush-cache`;

export const flushCacheCommand: CommandModule<
  {},
  {readonly 'stack-name': string | undefined; readonly 'yes': boolean}
> = {
  command: `${commandName} [options]`,
  describe: `Flush the REST API cache of the specified stack.`,

  builder: (argv) =>
    argv
      .options(`stack-name`, {
        describe: `An optional stack name, if not specified it will be determined from the config file`,
        string: true,
      })
      .options(`yes`, {
        describe: `Confirm the flushing of the REST API cache automatically`,
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
      args.stackName || getStackName(getDomainName(await readStackConfig()));

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
  },
};
