import * as rootPath from 'app-root-path';
import * as winston from 'winston';
import { isTest } from '../environment/isTest';

const { format } = winston;
const { align, colorize, combine, label, prettyPrint, printf, timestamp } =
  format;

const fileOptions = {
  filename: `${rootPath}/logs/cache-${new Date()
    .toISOString()
    .slice(0, 10)}.log`,
  format: combine(
    timestamp(),
    align(),
    printf(
      (info: any) =>
        `${info.level}: ${info.label} : ${[info.timestamp]}: ${info.message}`,
    ),
  ),
};

class Logger {
  private transports: unknown[] = [new winston.transports.Console()];
  private logger: winston.Logger;

  constructor(fileName: string) {
    if (isTest()) {
      this.transports.push(new winston.transports.File(fileOptions));
    }
    this.logger = winston.createLogger(
      this.logConfiguration(fileName) as winston.LoggerOptions,
    );
  }

  public getLogger() {
    return this.logger;
  }

  private logConfiguration(fileName: string) {
    return {
      transports: this.transports,
      format: combine(
        label({
          label: `🔊 {${fileName}}`,
        }),
        timestamp(),
        prettyPrint(),
        colorize(),
        printf(
          (info: { level: any; label: any; timestamp: any; message: any }) =>
            `${[info.timestamp]} [${info.level}] ${info.label}: ${
              info.message
            }`,
        ),
      ),
    };
  }
}

// This is for app logs
const logger = new Logger('API').getLogger();

export { Logger, logger };
