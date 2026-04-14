import { Injectable, Inject } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { IDENTITY_CLIENT } from '../../../database/supabase.module';
import { handleSupabaseError } from '../../../common/utils/supabase-error.handler';
import { User } from '../../../common/interfaces/database.interfaces';

@Injectable()
export class UserRepository {
  constructor(
    @Inject(IDENTITY_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  private readonly tableName = 'users';

  async findById<T = User>(
    id: string,
    select = 'id,full_name,email,role,status',
  ): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(select)
      .eq('id', id)
      .maybeSingle();

    if (error) handleSupabaseError(error, 'User');
    return data as T;
  }

  async update<T = User>(
    id: string,
    updates: Partial<User>,
    select = 'id,full_name,email,role,status',
  ): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select(select)
      .maybeSingle();

    if (error) handleSupabaseError(error, 'User');
    return data as T;
  }

  async create<T = User>(user: Partial<User>): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(user)
      .select('id,full_name,email,role,status')
      .maybeSingle();

    if (error) handleSupabaseError(error, 'User');
    return data as T;
  }

  async findByEmail<T = User>(email: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('id,full_name,email,role,status')
      .eq('email', email)
      .maybeSingle();

    if (error) handleSupabaseError(error, 'UserByEmail');
    return data as T | null;
  }

  async findByContactNumber<T = User>(
    contactNumber: string,
  ): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('id,full_name,email,role,status')
      .eq('contact_number', contactNumber)
      .maybeSingle();

    if (error) handleSupabaseError(error, 'UserByContact');
    return data as T | null;
  }
}
