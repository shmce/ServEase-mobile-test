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

type AddressTableName = 'user_addresses' | 'addresses';

const ADDRESS_TABLES: AddressTableName[] = ['user_addresses', 'addresses'];

const normalizeAddress = (row: any, fallbackUserId = ''): AddressRecord => ({
  id: row?.id ? String(row.id) : row?.address_id ? String(row.address_id) : undefined,
  user_id: String(row?.user_id || row?.customer_id || row?.owner_id || fallbackUserId || ''),
  street_address: String(
    row?.street_address || row?.address_line1 || row?.address || row?.line1 || ''
  ).trim(),
  city: String(row?.city || row?.municipality || '').trim(),
  province: String(row?.province || row?.state || '').trim(),
  zip_code: String(row?.zip_code ?? row?.postal_code ?? row?.zip ?? '').trim(),
  postal_code: String(row?.postal_code ?? row?.zip_code ?? row?.zip ?? '').trim(),
  created_at: row?.created_at || undefined,
});

const buildInsertPayloads = (address: AddressRecord) => {
  const street = String(address.street_address || '').trim();
  const city = String(address.city || '').trim();
  const province = String(address.province || '').trim();
  const zip = String(address.zip_code ?? address.postal_code ?? '').trim();

  return [
    {
      user_id: address.user_id,
      street_address: street,
      city,
      province,
      zip_code: zip,
    },
    {
      user_id: address.user_id,
      street_address: street,
      city,
      province,
      postal_code: zip,
    },
    {
      user_id: address.user_id,
      address_line1: street,
      city,
      province,
      postal_code: zip,
    },
    {
      user_id: address.user_id,
      address: street,
      city,
      province,
      postal_code: zip,
    },
  ];
};

const buildUpdatePayloads = (updates: Partial<AddressRecord>) => {
  const street = updates.street_address == null ? undefined : String(updates.street_address).trim();
  const city = updates.city == null ? undefined : String(updates.city).trim();
  const province = updates.province == null ? undefined : String(updates.province).trim();
  const zipRaw = updates.zip_code ?? updates.postal_code;
  const zip = zipRaw == null ? undefined : String(zipRaw).trim();

  return [
    {
      ...(street !== undefined ? { street_address: street } : {}),
      ...(city !== undefined ? { city } : {}),
      ...(province !== undefined ? { province } : {}),
      ...(zip !== undefined ? { zip_code: zip } : {}),
    },
    {
      ...(street !== undefined ? { street_address: street } : {}),
      ...(city !== undefined ? { city } : {}),
      ...(province !== undefined ? { province } : {}),
      ...(zip !== undefined ? { postal_code: zip } : {}),
    },
    {
      ...(street !== undefined ? { address_line1: street } : {}),
      ...(city !== undefined ? { city } : {}),
      ...(province !== undefined ? { province } : {}),
      ...(zip !== undefined ? { postal_code: zip } : {}),
    },
    {
      ...(street !== undefined ? { address: street } : {}),
      ...(city !== undefined ? { city } : {}),
      ...(province !== undefined ? { province } : {}),
      ...(zip !== undefined ? { postal_code: zip } : {}),
    },
  ].filter((payload) => Object.keys(payload).length > 0);
};

const trySelectAddresses = async (table: AddressTableName, userId: string) => {
  const filters = ['user_id', 'customer_id', 'owner_id'];

  for (const column of filters) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq(column, userId)
        .order('created_at', { ascending: false });

      if (!error) {
        return (data || []).map((row: any) => normalizeAddress(row, userId));
      }
    } catch {
      // Try next column/table shape.
    }
  }

  return null;
};

const tryInsertAddress = async (table: AddressTableName, address: AddressRecord) => {
  for (const payload of buildInsertPayloads(address)) {
    try {
      const { data, error } = await supabase
        .from(table)
        .insert([payload])
        .select('*')
        .maybeSingle();

      if (!error && data) {
        return normalizeAddress(data, address.user_id);
      }
    } catch {
      // Try next payload/table shape.
    }
  }

  return null;
};

const tryUpdateAddress = async (
  table: AddressTableName,
  id: string,
  updates: Partial<AddressRecord>
) => {
  const ownerFilters = ['user_id', 'customer_id', 'owner_id'];
  const idColumns = ['id', 'address_id'];

  for (const payload of buildUpdatePayloads(updates)) {
    const filterSets =
      updates.user_id
        ? ownerFilters.map((column) => ({ column, value: updates.user_id as string }))
        : [null];

    for (const idColumn of idColumns) {
      for (const filter of filterSets) {
        try {
          let query = supabase.from(table).update(payload).eq(idColumn, id);

          if (filter) {
            query = query.eq(filter.column, filter.value);
          }

          const { error } = await query;
          if (!error) {
            return {
              id,
              user_id: String(updates.user_id || ''),
              street_address: String(updates.street_address || '').trim(),
              city: String(updates.city || '').trim(),
              province: String(updates.province || '').trim(),
              zip_code: String(updates.zip_code ?? updates.postal_code ?? '').trim(),
              postal_code: String(updates.postal_code ?? updates.zip_code ?? '').trim(),
            };
          }
        } catch {
          // Try next filter/payload/id-column/table shape.
        }
      }
    }
  }

  return null;
};

const tryDeleteAddress = async (table: AddressTableName, id: string) => {
  for (const idColumn of ['id', 'address_id']) {
    try {
      const { error } = await supabase.from(table).delete().eq(idColumn, id);
      if (!error) return true;
    } catch {
      // Try next id shape.
    }
  }

  return false;
};

export const getUserAddresses = async (userId: string) => {
  let lastError: any = null;

  for (const table of ADDRESS_TABLES) {
    try {
      const rows = await trySelectAddresses(table, userId);
      if (rows) return rows;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(getErrorMessage(lastError, 'Failed to load addresses.'));
};

export const addAddress = async (address: AddressRecord) => {
  let lastError: any = null;

  for (const table of ADDRESS_TABLES) {
    try {
      const created = await tryInsertAddress(table, address);
      if (created) return created;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(getErrorMessage(lastError, 'Failed to save address.'));
};

export const updateAddress = async (id: string, updates: Partial<AddressRecord>) => {
  let lastError: any = null;

  for (const table of ADDRESS_TABLES) {
    try {
      const updated = await tryUpdateAddress(table, id, updates);
      if (updated) return updated;
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(getErrorMessage(lastError, 'Failed to update address.'));
};

export const deleteAddress = async (id: string) => {
  let deleted = false;

  for (const table of ADDRESS_TABLES) {
    // Keep trying until one table succeeds.
    deleted = (await tryDeleteAddress(table, id)) || deleted;
  }

  if (!deleted) {
    throw new Error('Failed to delete address.');
  }
};
