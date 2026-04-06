import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { IDENTITY_CLIENT } from '../../database/supabase.module';

@Injectable()
export class AddressesService {
  constructor(
    @Inject(IDENTITY_CLIENT) private readonly supabase: SupabaseClient,
  ) {}

  async getUserAddresses(userId: string) {
    const { data, error } = await this.supabase
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw new BadRequestException(error.message);
    return { addresses: data || [] };
  }

  async addAddress(userId: string, address: Record<string, any>) {
    await this.assertAddressWritable(userId, address.id);

    const { data, error } = await this.supabase
      .from('user_addresses')
      .insert([
        {
          ...address,
          user_id: userId,
        },
      ])
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return { address: data };
  }

  async updateAddress(
    userId: string,
    id: string,
    updates: Record<string, any>,
  ) {
    await this.assertAddressWritable(userId, id);

    const { data, error } = await this.supabase
      .from('user_addresses')
      .update({
        ...updates,
        user_id: userId,
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Address not found.');
    return { address: data };
  }

  async deleteAddress(userId: string, id: string) {
    await this.assertAddressWritable(userId, id);

    const { error } = await this.supabase
      .from('user_addresses')
      .delete()
      .eq('id', id);
    if (error) throw new BadRequestException(error.message);
    return { message: 'Address deleted.' };
  }

  private async assertAddressWritable(userId: string, addressId?: string) {
    if (!addressId) return;

    const { data, error } = await this.supabase
      .from('user_addresses')
      .select('id,user_id')
      .eq('id', addressId)
      .maybeSingle();

    if (error) throw new BadRequestException(error.message);
    if (!data) throw new NotFoundException('Address not found.');
    if (data.user_id !== userId) {
      throw new ForbiddenException('You do not have access to this address.');
    }
  }
}
