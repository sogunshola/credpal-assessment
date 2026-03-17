/* eslint-disable no-console */
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { TypeORMError } from 'typeorm';
import { isDev } from '../../environment/isDev';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorFormat = {
      error: null,
      message: null,
      code: null,
      stack: undefined,
    };

    if (isDev()) {
      errorFormat.stack = exception.stack;
      console.log('stack', errorFormat.stack);
    }

    if (exception instanceof TypeORMError) {
      const ormStatus = exception.name === 'EntityNotFoundError' ? HttpStatus.NOT_FOUND : status;
      errorFormat.message = exception.message
        .replace(/(\r\n|\n|\r)/gm, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      errorFormat.error = exception.name;
      errorFormat.code = ormStatus;
      console.log('error is', exception.message);
      return response.status(ormStatus).json(errorFormat);
    }

    errorFormat.code = status;

    if (!exception.response) {
      console.log('error is', exception.message);
      errorFormat.message = exception.message;
      errorFormat.error = exception.error ?? exception.constructor.name;
      return response.status(status).json(errorFormat);
    }

    console.log('error response is', exception.response);
    const data = exception.response;

    errorFormat.message = data.message;
    errorFormat.error = data.error ?? exception.constructor.name;

    return response.status(status).json(errorFormat);
  }
}
