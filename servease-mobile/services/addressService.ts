import { api } from '../lib/apiClient';

export type AddressRecord = {
  id?: string;
  user_id?: string;
  label?: string;
  street?: string;
  street_address?: string;
  barangay?: string;
  city?: string;
  province?: string;
  region?: string;
  postal_code?: string;
  zip_code?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_default?: boolean;
};

export const getUserAddresses = async (): Promise<AddressRecord[]> => {
  const { addresses } = await api.get<{ addresses: AddressRecord[] }>('/addresses');
  return addresses;
};

export const addAddress = async (address: AddressRecord): Promise<AddressRecord> => {
  const { address: created } = await api.post<{ address: AddressRecord }>('/addresses', address);
  return created;
};

export const updateAddress = async (id: string, updates: Partial<AddressRecord>): Promise<AddressRecord> => {
  const { address } = await api.patch<{ address: AddressRecord }>(`/addresses/${id}`, updates);
  return address;
};

export const deleteAddress = async (id: string): Promise<void> => {
  await api.delete(`/addresses/${id}`);
};
