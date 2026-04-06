import { ServiceUnavailableException, Logger } from '@nestjs/common';
import { timer, from, firstValueFrom } from 'rxjs';
import { retry, tap } from 'rxjs/operators';

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

/**
 * A lightweight Circuit Breaker implementation for NestJS.
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime?: number;
  private readonly logger = new Logger(CircuitBreaker.name);

  constructor(
    private readonly name: string,
    private readonly failureThreshold = 5,
    private readonly resetTimeoutMs = 30000, // 30 seconds
  ) {}

  /**
   * Executes a function with circuit breaker logic.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - (this.lastFailureTime || 0) > this.resetTimeoutMs) {
        this.state = CircuitState.HALF_OPEN;
        this.logger.log(
          `Circuit [${this.name}] shifted to HALF_OPEN. Testing...`,
        );
      } else {
        throw new ServiceUnavailableException(
          `Circuit [${this.name}] is OPEN.`,
        );
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  private onSuccess() {
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.CLOSED;
      this.failureCount = 0;
      this.logger.log(
        `Circuit [${this.name}] shifted back to CLOSED. Recovery successful.`,
      );
    }
    this.failureCount = 0;
  }

  private onFailure(_error: any) {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (
      this.state === CircuitState.HALF_OPEN ||
      this.failureCount >= this.failureThreshold
    ) {
      this.state = CircuitState.OPEN;
      this.logger.warn(
        `Circuit [${this.name}] tripped to OPEN. Threshold: ${this.failureThreshold} failures.`,
      );
    }
  }

  getState(): CircuitState {
    return this.state;
  }
}

/**
 * Exponential backoff retry utility for async operations.
 */
export function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  scalingDuration = 1000,
): Promise<T> {
  return firstValueFrom(
    from(fn()).pipe(
      retry({
        count: maxAttempts - 1,
        delay: (error, retryCount) => {
          const delayTime = Math.pow(2, retryCount) * scalingDuration;
          return timer(delayTime).pipe(
            tap(() =>
              Logger.debug(
                `Retrying [${retryCount}/${maxAttempts - 1}] after ${delayTime}ms...`,
                'Resilience',
              ),
            ),
          );
        },
      }),
    ) as any,
  );
}
