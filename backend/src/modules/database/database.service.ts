import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Database service for Supabase connections
 * Initializes clients for different schemas using microservice pattern
 */
@Injectable()
export class DatabaseService {
  private client: SupabaseClient;

  constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error(
        'Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env',
      );
    }

    this.client = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );
  }

  /**
   * Get the main Supabase client
   */
  getClient(): SupabaseClient {
    return this.client;
  }

  /**
   * Get client for a specific schema (microservice pattern)
   */
  getSchemaClient(schema: string): any {
    return createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { db: { schema } },
    );
  }

  /**
   * Health check - verify database connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from('user_profiles')
        .select('COUNT(*)', { count: 'exact', head: true });

      return !error;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }
}
