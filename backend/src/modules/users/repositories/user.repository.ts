import {
  Injectable,
  Inject,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { IDENTITY_CLIENT } from '../../../database/supabase.module';
import {
  handleSupabaseError,
  isNotFound,
} from '../../../common/utils/supabase-error.handler';

@Injectable()
export class UserRepository {
  constructor(
    @Inject(IDENTITY_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  private readonly tableName = 'users';

  async findById<T = any>(
    id: string,
    select = 'id,full_name,email,role,status',
  ): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(select)
      .eq('id', id)
      .single();

    if (error) handleSupabaseError(error, 'User');
    return data as T;
  }

  async update<T = any>(
    id: string,
    updates: any,
    select = 'id,full_name,email,role,status',
  ): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select(select)
      .single();

    if (error) handleSupabaseError(error, 'User');
    return data as T;
  }

  async create<T = any>(user: any): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(user)
      .select('id,full_name,email,role,status')
      .single();

    if (error) handleSupabaseError(error, 'User');
    return data as T;
  }

  async findByEmail<T = any>(email: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('id,full_name,email,role,status')
      .eq('email', email)
      .single();

    if (error && !isNotFound(error)) {
      handleSupabaseError(error, 'UserByEmail');
    }
    return data as T;
  }

  async findByContactNumber<T = any>(contactNumber: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('id,full_name,email,role,status')
      .eq('contact_number', contactNumber)
      .single();

    if (error && !isNotFound(error)) {
      handleSupabaseError(error, 'UserByContact');
    }
    return data as T;
  }
}
