import { Injectable, Inject, InternalServerErrorException } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { BOOKING_CLIENT, IDENTITY_CLIENT, CATALOG_CLIENT } from '../../database/supabase.module';
import { CustomerDashboardResponseDto } from './dto/customer-dashboard.dto';

@Injectable()
export class CustomerService {
  constructor(
    @Inject(BOOKING_CLIENT) private readonly bookingDb: SupabaseClient,
    @Inject(IDENTITY_CLIENT) private readonly identityDb: SupabaseClient,
    @Inject(CATALOG_CLIENT) private readonly catalogDb: SupabaseClient,
  ) {}

  async getDashboardData(customerId: string): Promise<any[]> {
    const { data: bookings, error } = await this.bookingDb
      .from('bookings')
      .select('id, booking_reference, status, scheduled_at, total_amount, created_at, updated_at, provider_id')
      .eq('customer_id', customerId)
      .in('status', ['pending', 'completed']);

    if (error) throw new InternalServerErrorException(error.message);
    const rows = bookings || [];
    if (!rows.length) return [];

    const providerIds = [...new Set(rows.map((b: any) => b.provider_id).filter(Boolean))];

    const [{ data: providers }, { data: profiles }] = await Promise.all([
      providerIds.length ? this.identityDb.from('users').select('id,full_name,contact_number').in('id', providerIds) : Promise.resolve({ data: [] }),
      providerIds.length ? this.catalogDb.from('provider_profiles').select('user_id,business_name,total_reviews,average_rating').in('user_id', providerIds) : Promise.resolve({ data: [] }),
    ]);

    const providerMap = new Map((providers || []).map((u: any) => [u.id, u]));
    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    return rows.map((booking: any) => {
      const user = providerMap.get(booking.provider_id);
      const profile = profileMap.get(booking.provider_id);

      return {
        id: booking.id,
        booking_reference: booking.booking_reference,
        status: booking.status,
        scheduled_at: booking.scheduled_at,
        total_amount: booking.total_amount,
        created_at: booking.created_at,
        updated_at: booking.updated_at,
        provider: {
          full_name: user?.full_name || 'N/A',
          contact_number: user?.contact_number || 'N/A',
          business_name: profile?.business_name || 'N/A',
          total_reviews: profile?.total_reviews || 0,
          average_rating: profile?.average_rating || 0,
        },
      };
    });
  }
}