import {
  Injectable,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { CATALOG_CLIENT } from '../../database/supabase.module';

@Injectable()
export class ReferenceService {
  constructor(
    @Inject(CATALOG_CLIENT) private readonly catalogDb: SupabaseClient,
  ) {}

  async getCategories() {
    try {
      const { data, error } = await this.catalogDb
        .from('service_categories')
        .select('id,name,slug,parent_id,category_level')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw new Error(error.message);
      return { message: 'Categories:', data };
    } catch {
      throw new InternalServerErrorException(
        'Failed to GET service categories',
      );
    }
  }
}
