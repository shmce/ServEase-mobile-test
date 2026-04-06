import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { TransformInterceptor } from './transform.interceptor';

describe('TransformInterceptor', () => {
  it('wraps handler data in the standard response envelope', (done) => {
    const interceptor = new TransformInterceptor<{ ok: boolean }>();
    const context = {
      switchToHttp: () => ({
        getResponse: () => ({
          statusCode: 201,
        }),
      }),
    } as ExecutionContext;
    const next: CallHandler<{ ok: boolean }> = {
      handle: () => of({ ok: true }),
    };

    interceptor.intercept(context, next).subscribe((value) => {
      expect(value).toEqual({
        statusCode: 201,
        message: 'Request successful',
        data: { ok: true },
      });
      done();
    });
  });
});
