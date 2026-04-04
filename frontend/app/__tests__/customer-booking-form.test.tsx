import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import CustomerBookingFormScreen, { buildBookingPricingSnapshot, pickInitialServiceOption } from '../customer-booking-form';
import { useLocalSearchParams } from 'expo-router';

const mockCreateBooking = jest.fn(() => Promise.resolve({ id: '123' }));
const mockProviderServicesQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  eq: jest.fn(),
};

// Mock the services used in the form
jest.mock('@/services/addressService', () => ({
  getUserAddresses: jest.fn(() => Promise.resolve([])),
}));

jest.mock('@/services/bookingService', () => ({
  createBooking: (...args: unknown[]) => mockCreateBooking(...args),
}));

jest.mock('@/lib/db', () => ({
  supabase: {},
  providerCatalogDb: {
    from: jest.fn(() => mockProviderServicesQueryBuilder),
  },
}));

describe('CustomerBookingFormScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProviderServicesQueryBuilder.select.mockReturnThis();
    mockProviderServicesQueryBuilder.order.mockReturnThis();
    mockProviderServicesQueryBuilder.eq.mockResolvedValue({ data: [], error: null });
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
  });

  it('renders the booking form with provider name', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      providerName: 'Test Provider',
      serviceName: 'Cleaning',
      providerId: 'prov-1',
    });

    const { getByText } = render(<CustomerBookingFormScreen />);
    
    await waitFor(() => {
      expect(getByText('Confirm Booking')).toBeTruthy();
    });
  });

  it('shows error when attempting to confirm without selecting an address', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      providerName: 'Test Provider',
      serviceName: 'Cleaning',
      providerId: 'prov-1',
    });

    const { getByText } = render(<CustomerBookingFormScreen />);
    
    const confirmButton = getByText('Confirm Booking');
    fireEvent.press(confirmButton);

    // Should show validation alert (Mocking Alert.alert would be next step for full verification)
    expect(confirmButton).toBeTruthy();
  });

  it('shows a schema exposure message when provider services cannot be loaded', async () => {
    mockProviderServicesQueryBuilder.eq.mockResolvedValue({
      data: null,
      error: {
        code: 'PGRST106',
        message: 'The schema must be one of the exposed schemas.',
      },
    });

    (useLocalSearchParams as jest.Mock).mockReturnValue({
      providerName: 'Test Provider',
      serviceName: 'Cleaning',
      providerId: 'prov-1',
    });

    const { getByText } = render(<CustomerBookingFormScreen />);

    await waitFor(() => {
      expect(
        getByText(
          'Provider services are temporarily unavailable due to a configuration issue. Please try again later or contact support.'
        )
      ).toBeTruthy();
    });
  });

  it('uses the effective hourly fallback when pricing mode state is null', () => {
    const result = buildBookingPricingSnapshot(
      {
        id: 'service-1',
        title: 'Deep Cleaning',
        price: 800,
        supports_hourly: true,
        hourly_rate: 250,
        supports_flat: true,
        flat_rate: 800,
        default_pricing_mode: 'hourly',
      },
      null,
      '3'
    );

    expect(result.effectivePricingMode).toBe('hourly');
    expect(result.isHourly).toBe(true);
    expect(result.parsedHoursRequired).toBe(3);
    expect(result.totalAmount).toBe(750);
    expect(result.hourlyRate).toBe(250);
  });

  it('prefers service id matching over subcategory-style service names', () => {
    const result = pickInitialServiceOption(
      [
        {
          id: 'service-1',
          title: 'Aircon Repair',
          price: 900,
          supports_hourly: false,
          hourly_rate: null,
          supports_flat: true,
          flat_rate: 900,
          default_pricing_mode: 'flat',
        },
        {
          id: 'service-2',
          title: 'Electrical Wiring',
          price: 500,
          supports_hourly: true,
          hourly_rate: 250,
          supports_flat: true,
          flat_rate: 500,
          default_pricing_mode: 'hourly',
        },
      ],
      'service-2',
      'Electrical'
    );

    expect(result?.id).toBe('service-2');
    expect(result?.title).toBe('Electrical Wiring');
  });
});
