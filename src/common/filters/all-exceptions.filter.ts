import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

type ErrorResponseBody = {
  message?: string | string[];
  error?: string;
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const httpContext = host.switchToHttp();
    const response = httpContext.getResponse<Response>();
    const request = httpContext.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const statusCode = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = isHttpException
      ? exception.getResponse()
      : undefined;
    const normalizedResponse =
      typeof exceptionResponse === 'string'
        ? { message: exceptionResponse }
        : (exceptionResponse as ErrorResponseBody | undefined);
    const message = normalizedResponse?.message ?? 'Internal server error';
    const error =
      normalizedResponse?.error ??
      (isHttpException ? HttpStatus[statusCode] : 'Internal Server Error');

    const logContext = `${request.method} ${request.url}`;

    if (statusCode >= 500) {
      this.logger.error(
        logContext,
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(`${logContext} - ${JSON.stringify(message)}`);
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
    });
  }
}
