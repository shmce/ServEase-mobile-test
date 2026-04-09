import { ServiceUnavailableException } from '@nestjs/common';
import { CircuitBreaker, CircuitState, withRetry } from './resilience.utils';

describe('CircuitBreaker', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('opens after hitting the failure threshold', async () => {
    const breaker = new CircuitBreaker('TEST', 2, 1000);

    await expect(
      breaker.execute(async () => Promise.reject(new Error('boom'))),
    ).rejects.toThrow('boom');
    await expect(
      breaker.execute(async () => Promise.reject(new Error('boom'))),
    ).rejects.toThrow('boom');

    expect(breaker.getState()).toBe(CircuitState.OPEN);
  });

  it('throws immediately while open before reset timeout', async () => {
    const breaker = new CircuitBreaker('TEST', 1, 60_000);

    await expect(
      breaker.execute(async () => Promise.reject(new Error('boom'))),
    ).rejects.toThrow('boom');

    await expect(breaker.execute(async () => 'ok')).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('moves to half-open after timeout and closes on success', async () => {
    const nowSpy = jest.spyOn(Date, 'now');
    const breaker = new CircuitBreaker('TEST', 1, 100);

    nowSpy.mockReturnValueOnce(1000);
    await expect(
      breaker.execute(async () => Promise.reject(new Error('boom'))),
    ).rejects.toThrow('boom');

    nowSpy.mockReturnValue(1201);
    await expect(breaker.execute(async () => 'recovered')).resolves.toBe(
      'recovered',
    );

    expect(breaker.getState()).toBe(CircuitState.CLOSED);
  });

  it('returns to open when half-open execution fails', async () => {
    const nowSpy = jest.spyOn(Date, 'now');
    const breaker = new CircuitBreaker('TEST', 1, 100);

    nowSpy.mockReturnValueOnce(1000);
    await expect(
      breaker.execute(async () => Promise.reject(new Error('boom'))),
    ).rejects.toThrow('boom');

    nowSpy.mockReturnValue(1201);
    await expect(
      breaker.execute(async () => Promise.reject(new Error('still-broken'))),
    ).rejects.toThrow('still-broken');

    expect(breaker.getState()).toBe(CircuitState.OPEN);
  });
});

describe('withRetry', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('returns immediately on success', async () => {
    const fn = jest.fn<Promise<string>, []>().mockResolvedValue('done');

    await expect(withRetry(fn, 3, 10)).resolves.toBe('done');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('rejects when the underlying operation fails', async () => {
    const error = new Error('persistent');
    const fn = jest.fn<Promise<string>, []>().mockRejectedValue(error);

    await expect(withRetry(fn, 2, 10)).rejects.toThrow('persistent');
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
