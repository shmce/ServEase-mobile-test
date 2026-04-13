import { api } from '@/lib/apiClient';

export type PricingMode = 'hourly' | 'flat';

export type ProviderServiceRecord = {
  id: string;
  title: string;
  description: string | null;
  price: number;
  category_id: string;
  supports_hourly: boolean;
  hourly_rate: number | null;
  supports_flat: boolean;
  flat_rate: number | null;
  default_pricing_mode: PricingMode | null;
  service_location_type: 'mobile' | 'in_shop';
  service_location_address: string | null;
};

export type ServiceCategoryRecord = {
  id: string;
  name: string;
  slug: string;
};

export async function getActiveServiceCategories() {
  const { categories } = await api.get<{ categories: ServiceCategoryRecord[] }>(
    '/services/categories',
  );
  return categories;
}

export async function getProviderServices(providerId: string) {
  const { services } = await api.get<{ services: ProviderServiceRecord[] }>(
    `/services/provider/${providerId}/services`,
  );
  return services;
}

export async function getMyProviderServices() {
  const { services } = await api.get<{ services: ProviderServiceRecord[] }>(
    '/provider/my-services',
  );
  return services;
}

export async function createMyProviderService(payload: Record<string, unknown>) {
  const { service } = await api.post<{ service: ProviderServiceRecord }>(
    '/provider/my-services',
    payload,
  );
  return service;
}

export async function updateMyProviderService(
  serviceId: string,
  payload: Record<string, unknown>,
) {
  const { service } = await api.patch<{ service: ProviderServiceRecord }>(
    `/provider/my-services/${serviceId}`,
    payload,
  );
  return service;
}

export async function deleteMyProviderService(serviceId: string) {
  await api.delete(`/provider/my-services/${serviceId}`);
}
