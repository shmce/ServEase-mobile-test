import {
  PostgrestResponse,
  PostgrestSingleResponse,
} from '@supabase/supabase-js';
import { handleSupabaseError } from './supabase-error.handler';
import { NotFoundException } from '@nestjs/common';

/**
 * Type-safe helper to extract data from a Supabase response.
 * Throws appropriate NestJS exceptions on error or missing data.
 */
export async function getResult<T>(
  promise: PromiseLike<PostgrestResponse<T> | PostgrestSingleResponse<T>>,
  context = 'Database',
  options: { allowEmpty?: boolean; notFoundMessage?: string } = {},
): Promise<T> {
  const { data, error } = await promise;

  if (error) {
    handleSupabaseError(error, context);
  }

  if (data === null || (Array.isArray(data) && data.length === 0)) {
    if (options.allowEmpty) {
      return (Array.isArray(data) ? [] : null) as unknown as T;
    }
    throw new NotFoundException(
      options.notFoundMessage || `${context}: Resource not found.`,
    );
  }

  return data as T;
}

/**
 * Type-safe helper for .maybeSingle() calls where null is a valid success state.
 */
export async function getMaybeSingle<T>(
  promise: PromiseLike<{ data: T | null; error: any }>,
  context = 'Database',
): Promise<T | null> {
  const { data, error } = await promise;

  if (error) {
    handleSupabaseError(error, context);
  }

  return data;
}
