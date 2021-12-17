import * as lambdaLocal from 'lambda-local';
import {format} from 'winston';

export function suppressLambdaResultLogging(): void {
  const logger = lambdaLocal.getLogger();

  logger.format = format.combine(
    format((info) => {
      if (`statusCode` in info && `headers` in info && `body` in info) {
        return false;
      }

      return info;
    })(),
    logger.format,
  );
}
