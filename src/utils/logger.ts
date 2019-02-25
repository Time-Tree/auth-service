import * as moment from 'moment';

// tslint:disable:no-console

export class Logger {
  msg(message: string) {
    console.log('\x1b[33m%s\x1b[0m', `[auth-service][${moment().format('MMMM Do YYYY, h:mm:ss a')}] ` + message);
  }

  err(message: string) {
    console.log('\x1b[31m%s\x1b[0m', `[auth-service][${moment().format('MMMM Do YYYY, h:mm:ss a')}] Error: ` + message);
  }

  server(message: string) {
    console.log('\x1b[34m%s\x1b[0m', `[auth-service][${moment().format('MMMM Do YYYY, h:mm:ss a')}] ` + message);
  }
}
const logger = new Logger();
export default logger;
