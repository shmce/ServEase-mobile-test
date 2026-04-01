import { Injectable, Inject, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { IDENTITY_CLIENT } from '../../../database/supabase.module';

@Injectable()
export class UserRepository {
  constructor(@Inject(IDENTITY_CLIENT) private readonly supabase: SupabaseClient) {}

  private readonly tableName = 'users';

  async findById<T = any>(id: string, select = 'id,full_name,email,contact_number,role,status'): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(select)
      .eq('id', id)
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    if (!data) throw new NotFoundException('User not found');
    return data as T;
  }

  async update<T = any>(id: string, updates: any, select = 'id,full_name,email,contact_number,role,status'): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select(select)
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data as T;
  }

  async create<T = any>(user: any): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(user)
      .select()
      .single();

    if (error) throw new InternalServerErrorException(error.message);
    return data as T;
  }

  async findByEmail<T = any>(email: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is 'no rows returned'
      throw new InternalServerErrorException(error.message);
    }
    return data as T;
  }

  async findByContactNumber<T = any>(contactNumber: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('contact_number', contactNumber)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new InternalServerErrorException(error.message);
    }
    return data as T;
  }
}


