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
export type ProviderCard = { id: string; name: string; businessName: string; rating: number; reviews: number; priceLabel: string };

export const getServiceCategories = async (): Promise<ServiceCategory[]> => {
  const { categories } = await api.get<{ categories: ServiceCategory[] }>('/services/categories');
  return categories;
};

export const getServicesByCategoryName = async (categoryName: string) => {
  const { services } = await api.get<{ services: any[] }>(`/services/categories/${encodeURIComponent(categoryName)}/services`);
  return services;
};

export const getProvidersByServiceName = async (serviceName: string): Promise<ProviderCard[]> => {
  const { providers } = await api.get<{ providers: ProviderCard[] }>(`/services/providers/${encodeURIComponent(serviceName)}`);
  return providers;
};

export const getProviderProfileData = async (providerId: string) => {
  return api.get<any>(`/services/provider-profile/${providerId}`);
};
