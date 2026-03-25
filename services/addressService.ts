import { supabase } from '../lib/supabase';
import { getErrorMessage } from '../lib/error-handling';

export type AddressRecord = {
  id?: string;
  user_id: string;
  street_address?: string;
  city?: string;
  province?: string;
  zip_code?: string;
  postal_code?: string;
  created_at?: string;
};

function normalizeAddress(row: any): AddressRecord {
  return {
    ...row,
    zip_code: row?.zip_code ?? row?.postal_code ?? '',
    postal_code: row?.postal_code ?? row?.zip_code ?? '',
  };
}

export const getUserAddresses = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching addresses:', error);
    throw new Error(getErrorMessage(error, 'Failed to load addresses.'));
  }
  return ((data || []) as any[]).map(normalizeAddress);
};

export const addAddress = async (address: AddressRecord) => {
  const payload = {
    ...address,
    zip_code: address.zip_code ?? address.postal_code ?? '',
    postal_code: address.postal_code ?? address.zip_code ?? '',
  };

  const { data, error } = await supabase
    .from('user_addresses')
    .insert([payload])
    .select()
    .single();

  if (error) throw new Error(getErrorMessage(error, 'Failed to save address.'));
  return normalizeAddress(data);
};

export const updateAddress = async (id: string, updates: Partial<AddressRecord>) => {
  const payload = {
    ...updates,
    zip_code: updates.zip_code ?? updates.postal_code,
    postal_code: updates.postal_code ?? updates.zip_code,
  };

  const { data, error } = await supabase
    .from('user_addresses')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(getErrorMessage(error, 'Failed to update address.'));
  return normalizeAddress(data);
};

export const deleteAddress = async (id: string) => {
  const { error } = await supabase
    .from('user_addresses')
    .delete()
    .eq('id', id);

  if (error) throw new Error(getErrorMessage(error, 'Failed to delete address.'));
};
