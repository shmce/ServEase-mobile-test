import {
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PostgrestError } from '@supabase/supabase-js';

/**
 * Standardizes Supabase/PostgREST errors into NestJS HTTP exceptions.
 */
export function handleSupabaseError(
  error: PostgrestError,
  context = 'Database',
): never {
  // PGRST116: No rows returned for .single() - handled manually in repos if null is expected
  // But if it's unexpected, it should be a 404.

  switch (error.code) {
    case '23505': // unique_violation
      throw new ConflictException(
        `${context}: Resource already exists. Details: ${error.details}`,
      );

    case '23503': // foreign_key_violation
      throw new BadRequestException(
        `${context}: Related resource not found. Details: ${error.details}`,
      );

    case 'PGRST116': // no rows returned
      throw new NotFoundException(`${context}: Not found.`);

    case '23502': // not_null_violation
      throw new BadRequestException(
        `${context}: Missing required field. Details: ${error.details}`,
      );

    default:
      console.error(`[SupabaseError] ${context}:`, error);
      throw new InternalServerErrorException(`${context}: ${error.message}`);
  }
}

/**
 * Checks if a Supabase error is a "no rows returned" error.
 */
export function isNotFound(error: any): boolean {
  return error?.code === 'PGRST116';
}
