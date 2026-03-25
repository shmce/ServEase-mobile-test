import { supabase } from '../lib/supabase';
import { getErrorMessage } from '../lib/error-handling';

export type ServiceCategory = {
  id: string;
  name: string;
  slug: string;
  is_active?: boolean;
};

export type ProviderService = {
  id: string;
  provider_id: string;
  category_id: string;
  title: string;
  description?: string | null;
  price: number;
};

export type ProviderCard = {
  id: string;
  name: string;
  businessName: string;
  rating: number;
  reviews: number;
  priceLabel: string;
};

export const getServiceCategories = async () => {
  const { data, error } = await supabase
    .from('service_categories')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) throw new Error(getErrorMessage(error, 'Failed to load categories.'));
  return (data || []) as ServiceCategory[];
};

export const getServicesByCategoryName = async (categoryName: string) => {
  const { data: category, error: categoryError } = await supabase
    .from('service_categories')
    .select('id,name,slug')
    .ilike('name', categoryName)
    .maybeSingle();

  if (categoryError) {
    throw new Error(getErrorMessage(categoryError, 'Failed to resolve category.'));
  }

  if (!category?.id) return [];

  const { data: services, error: servicesError } = await supabase
    .from('provider_services')
    .select('id,title,description,price')
    .eq('category_id', category.id)
    .order('title', { ascending: true });

  if (servicesError) {
    throw new Error(getErrorMessage(servicesError, 'Failed to load category services.'));
  }

  return services || [];
};

export const getProvidersByServiceName = async (serviceName: string) => {
  const { data: serviceRows, error: servicesError } = await supabase
    .from('provider_services')
    .select('id,provider_id,title,price')
    .ilike('title', serviceName);

  if (servicesError) {
    throw new Error(getErrorMessage(servicesError, 'Failed to load providers for this service.'));
  }

  const rows = serviceRows || [];
  if (!rows.length) return [] as ProviderCard[];

  const providerIds = Array.from(new Set(rows.map((r: any) => r.provider_id)));

  const [{ data: usersData, error: usersError }, { data: profilesData, error: profilesError }] = await Promise.all([
    supabase.from('users').select('id,full_name').in('id', providerIds),
    supabase.from('provider_profiles').select('user_id,business_name,average_rating,total_reviews').in('user_id', providerIds),
  ]);

  if (usersError) throw new Error(getErrorMessage(usersError, 'Failed to load provider users.'));
  if (profilesError) throw new Error(getErrorMessage(profilesError, 'Failed to load provider profiles.'));

  const usersMap = new Map((usersData || []).map((u: any) => [u.id, u]));
  const profilesMap = new Map((profilesData || []).map((p: any) => [p.user_id, p]));

  return providerIds.map((providerId) => {
    const cheapest = rows
      .filter((r: any) => r.provider_id === providerId)
      .sort((a: any, b: any) => Number(a.price || 0) - Number(b.price || 0))[0];

    const user = usersMap.get(providerId);
    const profile = profilesMap.get(providerId);

    return {
      id: providerId,
      name: user?.full_name || 'Service Provider',
      businessName: profile?.business_name || user?.full_name || 'Service Provider',
      rating: Number(profile?.average_rating || 0),
      reviews: Number(profile?.total_reviews || 0),
      priceLabel: `P${Number(cheapest?.price || 0).toFixed(2)}`,
    };
  });
};

export const getProviderProfileData = async (providerId: string) => {
  const [{ data: user, error: userError }, { data: profile, error: profileError }, { data: services, error: servicesError }, { data: reviews, error: reviewsError }] = await Promise.all([
    supabase.from('users').select('id,full_name,email,contact_number').eq('id', providerId).maybeSingle(),
    supabase.from('provider_profiles').select('*').eq('user_id', providerId).maybeSingle(),
    supabase.from('provider_services').select('*').eq('provider_id', providerId).order('created_at', { ascending: false }),
    supabase.from('reviews').select('*').eq('reviewee_id', providerId).order('created_at', { ascending: false }),
  ]);

  if (userError) throw new Error(getErrorMessage(userError, 'Failed to load provider user.'));
  if (profileError) throw new Error(getErrorMessage(profileError, 'Failed to load provider profile.'));
  if (servicesError) throw new Error(getErrorMessage(servicesError, 'Failed to load provider services.'));
  if (reviewsError) throw new Error(getErrorMessage(reviewsError, 'Failed to load provider reviews.'));

  let reviewerNames = new Map<string, string>();
  const reviewerIds = Array.from(new Set((reviews || []).map((r: any) => r.reviewer_id).filter(Boolean)));
  if (reviewerIds.length) {
    const { data: reviewerRows } = await supabase.from('users').select('id,full_name').in('id', reviewerIds);
    reviewerNames = new Map((reviewerRows || []).map((u: any) => [u.id, u.full_name || 'User']));
  }

  return {
    user,
    profile,
    services: (services || []) as ProviderService[],
    reviews: (reviews || []).map((r: any) => ({
      ...r,
      reviewer_name: reviewerNames.get(r.reviewer_id) || 'User',
    })),
  };
};
