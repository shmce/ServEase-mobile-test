import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { isNotFound } from './supabase-error.handler';
import { handleSupabaseError } from './supabase-error.handler';

describe('supabase-error.handler', () => {
  it('maps unique violations to ConflictException', () => {
    expect(() =>
      handleSupabaseError({
        code: '23505',
        details: 'duplicate key',
        hint: '',
        message: 'duplicate',
        name: 'PostgrestError',
      }),
    ).toThrow(ConflictException);
  });

  it('maps no-row errors to NotFoundException', () => {
    expect(() =>
      handleSupabaseError({
        code: 'PGRST116',
        details: 'not found',
        hint: '',
        message: 'missing',
        name: 'PostgrestError',
      }),
    ).toThrow(NotFoundException);
  });

  it('maps not-null violations to BadRequestException', () => {
    expect(() =>
      handleSupabaseError({
        code: '23502',
        details: 'missing field',
        hint: '',
        message: 'invalid',
        name: 'PostgrestError',
      }),
    ).toThrow(BadRequestException);
  });

  it('detects PostgREST not found errors safely', () => {
    expect(isNotFound({ code: 'PGRST116' })).toBe(true);
    expect(isNotFound({ code: 'OTHER' })).toBe(false);
    expect(isNotFound(null)).toBe(false);
  });
});
