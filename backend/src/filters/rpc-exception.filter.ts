import { Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { throwError } from 'rxjs';

/**
 * Converts Kafka/RPC errors back into proper HTTP responses.
 * Without this, any exception thrown by a microservice causes the gateway
 * to crash with a generic 500 "Internal server error".
 */
@Catch()
export class RpcToHttpExceptionFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    // NestJS microservice errors arrive as plain objects: { status, message }
    if (typeof exception === 'object' && exception !== null) {
      const err = exception as Record<string, unknown>;
      const message = err['message'] ?? 'Internal server error';
      const status = this.resolveStatus(err);
      if (response && typeof response.status === 'function') {
        return response.status(status).json({ statusCode: status, message });
      }
    }

    // Fall back to NestJS default handling for everything else
    super.catch(exception, host);
  }

  private resolveStatus(err: Record<string, unknown>): number {
    const raw = err['statusCode'] ?? err['status'];
    if (typeof raw === 'number' && raw >= 100 && raw < 600) return raw;
    if (typeof raw === 'string') {
      switch (raw.toLowerCase()) {
        case 'unauthorized': return HttpStatus.UNAUTHORIZED;
        case 'forbidden':    return HttpStatus.FORBIDDEN;
        case 'not_found':    return HttpStatus.NOT_FOUND;
        case 'bad_request':  return HttpStatus.BAD_REQUEST;
        case 'conflict':     return HttpStatus.CONFLICT;
        default:             return HttpStatus.INTERNAL_SERVER_ERROR;
      }
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}

// Re-export operator for observable-based message patterns (not used here but handy)
export const rpcExceptionToObservable = (err: unknown) => throwError(() => err);
