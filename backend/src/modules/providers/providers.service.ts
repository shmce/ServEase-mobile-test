import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

interface Provider {
  id: string;
  name: string;
  businessName: string;
  rating: number;
  totalReviews: number;
  description: string;
}

/**
 * Providers service - handles provider profile queries
 */
@Injectable()
export class ProvidersService {
  constructor(private db: DatabaseService) {}

  /**
   * Get all providers with their profiles
   */
  async getAllProviders() {
    try {
      const client = this.db.getClient();
      const { data, error } = await client
        .from('provider_profiles')
        .select(
          `
          id,
          user_id,
          rating,
          total_reviews,
          service_areas,
          user_profiles(id, full_name, bio, avatar_url)
        `,
        )
        .order('rating', { ascending: false });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data || [],
        count: data?.length || 0,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        data: [],
      };
    }
  }

  /**
   * Get provider by ID with full details
   */
  async getProviderById(providerId: string) {
    try {
      const client = this.db.getClient();
      const { data, error } = await client
        .from('provider_profiles')
        .select(
          `
          *,
          user_profiles(*),
          services(*)
        `,
        )
        .eq('id', providerId)
        .single();

      if (error) {
        throw error;
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get providers by service category
   */
  async getProvidersByCategory(category: string) {
    try {
      const client = this.db.getClient();
      const { data, error } = await client
        .from('services')
        .select(
          `
          *,
          provider_profiles(
            id,
            rating,
            total_reviews,
            user_profiles(full_name, bio)
          )
        `,
        )
        .eq('category', category)
        .order('provider_profiles(rating)', { ascending: false });

      if (error) {
        throw error;
      }

      return {
        success: true,
        data: data || [],
        count: data?.length || 0,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        data: [],
      };
    }
  }
}
