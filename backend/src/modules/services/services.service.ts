import {
  Injectable,
  Inject,
  InternalServerErrorException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import {
  CATALOG_CLIENT,
  IDENTITY_CLIENT,
  TRUST_CLIENT,
} from '../../database/supabase.module';
import {
  ProviderService,
  User,
  ProviderProfile,
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
    const { data, error } = await this.catalogDb
      .from('service_categories')
      .select('id,name,slug,is_active,parent_id,category_level')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw new InternalServerErrorException(error.message);
    return { categories: data || [] };
  }

  async getServicesByCategoryName(categoryName: string) {
    const { data: category, error: catErr } = await this.catalogDb
      .from('service_categories')
      .select('id,name,slug,parent_id,category_level')
      .ilike('name', categoryName)
      .maybeSingle();

    if (catErr) throw new InternalServerErrorException(catErr.message);
    if (!category?.id) return { services: [] };

    const { data: services, error: svcErr } = await this.catalogDb
      .from('provider_services')
      .select(
        'id,title,description,price,supports_hourly,hourly_rate,supports_flat,flat_rate,default_pricing_mode',
      )
      .eq('category_id', category.id)
      .order('title', { ascending: true });

    if (svcErr) throw new InternalServerErrorException(svcErr.message);
    return { services: services || [] };
  }

  async getProvidersByServiceName(serviceName: string) {
    const { data: serviceRows, error: svcErr } = await this.catalogDb
      .from('provider_services')
      .select(
        'id,provider_id,title,price,supports_hourly,hourly_rate,supports_flat,flat_rate,default_pricing_mode',
      )
      .ilike('title', serviceName);

    if (svcErr) throw new InternalServerErrorException(svcErr.message);
    const rows = (serviceRows || []) as Partial<ProviderService>[];
    if (!rows.length) return { providers: [] };

    const providerIds = [
      ...new Set(
        rows.map((r) => r.provider_id).filter((id): id is string => !!id),
      ),
    ];

    const [{ data: usersData }, { data: profilesData }] = await Promise.all([
      this.identityDb
        .from('users')
        .select('id,full_name')
        .in('id', providerIds),
      this.catalogDb
        .from('provider_profiles')
        .select('user_id,business_name,average_rating,total_reviews')
        .in('user_id', providerIds),
    ]);

    const usersMap = new Map<string, Pick<User, 'id' | 'full_name'>>(
      (usersData || []).map((u: unknown) => {
        const user = u as Pick<User, 'id' | 'full_name'>;
        return [user.id, user];
      }),
    );
    const profilesMap = new Map<
      string,
      Pick<
        ProviderProfile,
        'user_id' | 'business_name' | 'average_rating' | 'total_reviews'
      >
    >(
      (profilesData || []).map((p: unknown) => {
        const profile = p as Pick<
          ProviderProfile,
          'user_id' | 'business_name' | 'average_rating' | 'total_reviews'
        >;
        return [profile.user_id, profile];
      }),
    );

    const providers = providerIds.map((providerId) => {
      const cheapest = rows
        .filter((r) => r.provider_id === providerId)
        .sort((a, b) => Number(a.price || 0) - Number(b.price || 0))[0];

      const user = usersMap.get(providerId);
      const profile = profilesMap.get(providerId);

      return {
        id: providerId,
        name: user?.full_name || 'Service Provider',
        businessName:
          profile?.business_name || user?.full_name || 'Service Provider',
        rating: Number(profile?.average_rating || 0),
        reviews: Number(profile?.total_reviews || 0),
        priceLabel: `P${Number(cheapest?.price || 0).toFixed(2)}`,
      };
    });

    return { providers };
  }

  async getProviderProfileData(providerId: string) {
    const [
      { data: user },
      { data: profile },
      { data: services },
      { data: reviews },
    ] = await Promise.all([
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

    const reviewsList = (reviews || []) as ProviderReview[];
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
      user: user as Pick<
        User,
        'id' | 'full_name' | 'email' | 'contact_number' | 'created_at'
      > | null,
      profile: profile as ProviderProfile | null,
      services: (services || []) as ProviderService[],
      reviews: (reviews || []).map((r: unknown) => {
        const review = r as ProviderReview;
        return {
          ...review,
          reviewer_name: reviewerNames.get(review.reviewer_id) || 'User',
        };
      }),
    };
  }

  async searchServices(keyword?: string) {
    try {
      let query = this.catalogDb
        .from('provider_services')
        .select(
          `id, title, price, description, supports_hourly, hourly_rate, supports_flat, flat_rate, default_pricing_mode, service_categories!inner(id,name,slug), provider_profiles!inner(user_id,business_name,trust_score,verification_status)`,
        )
        .eq('provider_profiles.verification_status', 'approved');

      if (keyword)
        query = query.ilike('service_categories.name', `%${keyword}%`);

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      const sorted = ((data || []) as any[]).sort((a: any, b: any) => {
        const scoreA =
          (a.provider_profiles as unknown as ProviderProfile)?.trust_score || 0;
        const scoreB =
          (b.provider_profiles as unknown as ProviderProfile)?.trust_score || 0;
        return scoreB - scoreA;
      });

      return { status: 200, message: 'Search successful', results: sorted };
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
