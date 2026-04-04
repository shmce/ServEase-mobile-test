import { api } from '../lib/apiClient';

export type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  is_active?: boolean;
  parent_id?: string | null;
  category_level?: 'category' | 'subcategory';
};
export type ProviderService = { id: string; provider_id: string; category_id: string; title: string; description?: string | null; price: number };
export type ProviderCard = {
  id: string;
  name: string;
  businessName: string;
  serviceId: string;
  serviceName: string;
  rating: number;
  reviews: number;
  priceLabel: string;
};

type RawProviderRow = {
  id: string;
  title?: string | null;
  price?: number | null;
  provider_profiles?: {
    user_id?: string | null;
    business_name?: string | null;
    average_rating?: number | null;
  } | null;
};

function mapProviderRowToCard(row: RawProviderRow): ProviderCard | null {
  const businessName = String(row.provider_profiles?.business_name || '').trim();
  const providerId = String(row.provider_profiles?.user_id || '').trim();
  const rating = Number(row.provider_profiles?.average_rating || 0);
  const rawPrice = Number(row.price);

  if (!providerId) {
    console.warn('Provider discovery row is missing provider_profiles.user_id; dropping row from provider list.', {
      serviceRowId: row.id,
      businessName,
    });
    return null;
  }

  return {
    id: providerId,
    name: businessName || 'Provider',
    businessName,
    serviceId: String(row.id || '').trim(),
    serviceName: String(row.title || '').trim(),
    rating: Number.isFinite(rating) ? rating : 0,
    reviews: 0,
    priceLabel: Number.isFinite(rawPrice) && rawPrice >= 0 ? `P${rawPrice.toFixed(2)}` : '',
  };
}

export const getServiceCategories = async (): Promise<ServiceCategory[]> => {
  const { categories } = await api.get<{ categories: ServiceCategory[] }>('/services/categories');
  return categories;
};

export const getServicesByCategoryName = async (categoryName: string) => {
  const { services } = await api.get<{ services: any[] }>(`/services/categories/${encodeURIComponent(categoryName)}/services`);
  return services;
};

export const getProvidersByServiceName = async (serviceName: string): Promise<ProviderCard[]> => {
  const { providers } = await api.get<{ providers: RawProviderRow[] }>(`/services/providers/${encodeURIComponent(serviceName)}`);
  const cardsByProviderId = new Map<string, ProviderCard>();

  for (const row of providers || []) {
    const card = mapProviderRowToCard(row);
    if (!card) continue;
    if (!cardsByProviderId.has(card.id)) {
      cardsByProviderId.set(card.id, card);
    }
  }

  return Array.from(cardsByProviderId.values());
};

export const getProviderProfileData = async (providerId: string) => {
  return api.get<any>(`/services/provider-profile/${providerId}`);
};
