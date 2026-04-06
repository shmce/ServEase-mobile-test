import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

type HttpErrorBody = {
  message?: string | string[];
  error?: string;
  statusCode?: number;
};

function isHttpErrorBody(value: unknown): value is HttpErrorBody {
  return typeof value === 'object' && value !== null;
}

function getErrorMessage(body: string | HttpErrorBody): string {
  if (typeof body === 'string') {
    return body;
  }

  if (Array.isArray(body.message)) {
    return body.message.join(', ');
  }

  return body.message ?? body.error ?? 'Internal server error';
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody: string | HttpErrorBody =
      exception instanceof HttpException
        ? isHttpErrorBody(exception.getResponse()) ||
          typeof exception.getResponse() === 'string'
          ? exception.getResponse()
          : { error: 'Unexpected error response shape' }
        : { message: (exception as Error).message, statusCode: status };

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: getErrorMessage(responseBody),
    };

    // Log the error (can be expanded with a proper LoggerService)
    if (status === Number(HttpStatus.INTERNAL_SERVER_ERROR)) {
      console.error(`[Error] ${request.method} ${request.url}`, exception);
    }

    response.status(status).json(errorResponse);
  }
}
