import {
  Injectable,
  Inject,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  CATALOG_CLIENT,
  IDENTITY_CLIENT,
  TRUST_CLIENT,
} from '../../database/supabase.module';
import {
  ProviderProfile,
  ProviderService as IProviderService,
  User,
  ProviderReview,
} from '../../common/interfaces/database.interfaces';

@Injectable()
export class ServicesService {
  constructor(
    @Inject(CATALOG_CLIENT) private readonly catalogDb: SupabaseClient,
    @Inject(IDENTITY_CLIENT) private readonly identityDb: SupabaseClient,
    @Inject(TRUST_CLIENT) private readonly trustDb: SupabaseClient,
  ) {}

  async getServiceCategories() {
    const response = await this.catalogDb
      .from('service_categories')
      .select('id,name,slug,is_active,parent_id,category_level')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (response.error)
      throw new InternalServerErrorException(response.error.message);
    return { categories: response.data || [] };
  }

  async getServicesByCategoryName(categoryName: string) {
    const response = await this.catalogDb
      .from('service_categories')
      .select('id,name,slug,parent_id,category_level')
      .ilike('name', categoryName)
      .maybeSingle();

    if (response.error)
      throw new InternalServerErrorException(response.error.message);
    if (!response.data) throw new NotFoundException('Category not found');

    const category = response.data;

    const servicesResponse = await this.catalogDb
      .from('provider_services')
      .select(
        'id,title,price,description,supports_hourly,hourly_rate,supports_flat,flat_rate,default_pricing_mode,service_location_type,service_location_address,provider_profiles(user_id,business_name,average_rating,verification_status,avatar_url)',
      )
      .eq('category_id', category.id)
      .eq('provider_profiles.verification_status', 'approved');

    if (servicesResponse.error)
      throw new InternalServerErrorException(servicesResponse.error.message);

    return {
      category,
      services: servicesResponse.data || [],
    };
  }

  async getTopProviders() {
    const response = await this.catalogDb
      .from('provider_profiles')
      .select(
        'user_id,business_name,average_rating,verification_status,avatar_url',
      )
      .eq('verification_status', 'approved')
      .order('average_rating', { ascending: false })
      .limit(5);

    if (response.error)
      throw new InternalServerErrorException(response.error.message);
    return { providers: response.data || [] };
  }

  async getFeaturedProviders() {
    const response = await this.catalogDb
      .from('provider_profiles')
      .select(
        'user_id,business_name,average_rating,verification_status,avatar_url',
      )
      .eq('verification_status', 'approved')
      .order('average_rating', { ascending: false })
      .limit(5);

    if (response.error)
      throw new InternalServerErrorException(response.error.message);
    return { providers: response.data || [] };
  }

  async getProviderProfileData(providerId: string) {
    const [userResponse, profileResponse, servicesResponse, reviewsResponse] =
      await Promise.all([
        this.identityDb
          .from('users')
          .select('id,full_name,email,contact_number,created_at')
          .eq('id', providerId)
          .maybeSingle(),
        this.catalogDb
          .from('provider_profiles')
          .select('*')
          .eq('user_id', providerId)
          .maybeSingle(),
        this.catalogDb
          .from('provider_services')
          .select('*')
          .eq('provider_id', providerId)
          .order('created_at', { ascending: false }),
        this.trustDb
          .from('reviews')
          .select('*')
          .eq('reviewee_id', providerId)
          .order('created_at', { ascending: false }),
      ]);

    const reviewsList = (reviewsResponse.data || []) as ProviderReview[];
    const reviewerIds = [
      ...new Set(
        reviewsList.map((r: ProviderReview) => r.reviewer_id).filter(Boolean),
      ),
    ];
    let reviewerNames = new Map<string, string>();
    if (reviewerIds.length) {
      const { data: reviewerRows } = await this.identityDb
        .from('users')
        .select('id,full_name')
        .in('id', reviewerIds);
      reviewerNames = new Map(
        (reviewerRows || []).map((u: unknown) => {
          const user = u as Pick<User, 'id' | 'full_name'>;
          return [user.id, user.full_name || 'User'];
        }),
      );
    }

    return {
      user: userResponse.data as Pick<
        User,
        'id' | 'full_name' | 'email' | 'contact_number' | 'created_at'
      > | null,
      profile: profileResponse.data as ProviderProfile | null,
      services: (servicesResponse.data || []) as IProviderService[],
      reviews: (reviewsResponse.data || []).map((r: unknown) => {
        const review = r as ProviderReview;
        return {
          ...review,
          reviewer_name: reviewerNames.get(review.reviewer_id) || 'User',
        };
      }),
    };
  }

  async getProviderServices(providerId: string) {
    const response = await this.catalogDb
      .from('provider_services')
      .select(
        'id,title,price,description,supports_hourly,hourly_rate,supports_flat,flat_rate,default_pricing_mode,service_location_type,service_location_address',
      )
      .eq('provider_id', providerId)
      .order('title', { ascending: true });

    if (response.error)
      throw new InternalServerErrorException(response.error.message);

    return { services: response.data || [] };
  }

  async getProvidersByServiceName(serviceName: string) {
    const normalizedServiceName = String(serviceName || '').trim();

    const queryProjection =
      'id,title,price,description,supports_hourly,hourly_rate,supports_flat,flat_rate,default_pricing_mode,service_location_type,service_location_address,service_categories!inner(id,name,slug),provider_profiles!inner(user_id,business_name,average_rating,verification_status,avatar_url)';

    const categoryMatchResponse = await this.catalogDb
      .from('provider_services')
      .select(queryProjection)
      .ilike('service_categories.name', normalizedServiceName)
      .eq('provider_profiles.verification_status', 'approved');

    if (categoryMatchResponse.error)
      throw new InternalServerErrorException(
        categoryMatchResponse.error.message,
      );

    if ((categoryMatchResponse.data || []).length > 0) {
      return {
        service_name: serviceName,
        providers: categoryMatchResponse.data || [],
      };
    }

    const titleMatchResponse = await this.catalogDb
      .from('provider_services')
      .select(queryProjection)
      .ilike('title', `%${normalizedServiceName}%`)
      .eq('provider_profiles.verification_status', 'approved');

    if (titleMatchResponse.error)
      throw new InternalServerErrorException(titleMatchResponse.error.message);

    return {
      service_name: serviceName,
      providers: titleMatchResponse.data || [],
    };
  }

  async searchServices(keyword?: string) {
    try {
      let query = this.catalogDb
        .from('provider_services')
        .select(
          `id, title, price, description, supports_hourly, hourly_rate, supports_flat, flat_rate, default_pricing_mode, service_location_type, service_location_address, service_categories!inner(id,name,slug), provider_profiles!inner(user_id,business_name,average_rating,verification_status,avatar_url)`,
        )
        .eq('provider_profiles.verification_status', 'approved');

      if (keyword)
        query = query.ilike('service_categories.name', `%${keyword}%`);

      const response = await query;
      if (response.error) throw new Error(response.error.message);

      type RowWithProfile = { provider_profiles?: Partial<ProviderProfile> };
      const sorted = ((response.data as RowWithProfile[]) || []).sort(
        (a, b) => {
          const scoreA = a.provider_profiles?.average_rating ?? 0;
          const scoreB = b.provider_profiles?.average_rating ?? 0;
          return scoreB - scoreA;
        },
      );

      return { status: 200, message: 'Search successful', results: sorted };
    } catch (err) {
      throw new InternalServerErrorException((err as Error).message);
    }
  }
}
