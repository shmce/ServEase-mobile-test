import { getProvidersByServiceName } from '../marketplaceService';
import { api } from '@/lib/apiClient';

jest.mock('@/lib/apiClient', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockApiGet = api.get as jest.MockedFunction<typeof api.get>;

describe('getProvidersByServiceName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(jest.fn());
  });

  it('deduplicates provider service rows and filters rows without a valid provider user id', async () => {
    mockApiGet.mockResolvedValue({
      providers: [
        {
          id: 'service-row-1',
          title: 'Electrical Wiring',
          price: 500,
          service_location_type: 'in_shop',
          service_location_address: '123 Circuit Ave, Makati',
          provider_profiles: {
            user_id: 'provider-user-1',
            business_name: 'Santos Electric',
            average_rating: 4.8,
            avatar_url: 'https://example.com/avatar-1.jpg',
          },
        },
        {
          id: 'service-row-1b',
          title: 'Ceiling Fan Repair',
          price: 0,
          service_location_type: 'mobile',
          service_location_address: null,
          provider_profiles: {
            user_id: 'provider-user-1',
            business_name: 'Santos Electric',
            average_rating: 4.9,
            avatar_url: 'https://example.com/avatar-1b.jpg',
          },
        },
        {
          id: 'service-row-2',
          price: null,
          provider_profiles: {
            user_id: null,
            business_name: null,
            average_rating: null,
          },
        },
      ],
    } as any);

    const result = await getProvidersByServiceName('Electrical');

    expect(mockApiGet).toHaveBeenCalledWith('/services/providers/Electrical');
    expect(result).toEqual([
      {
        id: 'provider-user-1',
        name: 'Santos Electric',
        businessName: 'Santos Electric',
        avatarUrl: 'https://example.com/avatar-1.jpg',
        serviceId: 'service-row-1',
        serviceName: 'Electrical Wiring',
        rating: 4.8,
        reviews: 0,
        priceLabel: 'P500.00',
        serviceLocationType: 'in_shop',
        serviceLocationAddress: '123 Circuit Ave, Makati',
      },
    ]);
    expect(console.warn).toHaveBeenCalledWith(
      'Provider discovery row is missing provider_profiles.user_id; dropping row from provider list.',
      {
        serviceRowId: 'service-row-2',
        businessName: '',
      }
    );
  });

  it('keeps zero-priced services as an explicit price label', async () => {
    mockApiGet.mockResolvedValue({
      providers: [
        {
          id: 'service-row-free',
          title: 'Free Consultation',
          price: 0,
          service_location_type: 'mobile',
          service_location_address: null,
          provider_profiles: {
            user_id: 'provider-user-free',
            business_name: 'Helpful Electric',
            average_rating: 5,
            avatar_url: null,
          },
        },
      ],
    } as any);

    const result = await getProvidersByServiceName('Consultation');

    expect(result).toEqual([
      {
        id: 'provider-user-free',
        name: 'Helpful Electric',
        businessName: 'Helpful Electric',
        avatarUrl: '',
        serviceId: 'service-row-free',
        serviceName: 'Free Consultation',
        rating: 5,
        reviews: 0,
        priceLabel: 'P0.00',
        serviceLocationType: 'mobile',
        serviceLocationAddress: null,
      },
    ]);
  });
});
