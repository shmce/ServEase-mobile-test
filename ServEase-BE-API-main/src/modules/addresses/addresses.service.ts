import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { IDENTITY_CLIENT } from '../../database/supabase.module';

@Injectable()
export class AddressesService {
  constructor(@Inject(IDENTITY_CLIENT) private readonly supabase: SupabaseClient) {}

  async getUserAddresses(userId: string) {
    const { data, error } = await this.supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return { addresses: data || [] };
  }

  async addAddress(address: Record<string, any>) {
    const { data, error } = await this.supabase
      .from('user_addresses')
      .insert([address])
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return { address: data };
  }

  async updateAddress(id: string, updates: Record<string, any>) {
    const { data, error } = await this.supabase
      .from('user_addresses')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Address not found.');
    return { address: data };
  }

  async deleteAddress(id: string) {
    const { error } = await this.supabase.from('user_addresses').delete().eq('id', id);
    if (error) throw new BadRequestException(error.message);
    return { message: 'Address deleted.' };
  }
}
