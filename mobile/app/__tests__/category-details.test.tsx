import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CategoryDetailsScreen from '../category-details';
import { useLocalSearchParams } from 'expo-router';

const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    setParams: jest.fn(),
    canGoBack: jest.fn(() => true),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  useFocusEffect: jest.fn(),
}));

jest.mock('@/services/marketplaceService', () => ({
  getServicesByCategoryName: jest.fn(() => Promise.resolve([])),
}));

describe('CategoryDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('navigates subcategory taps directly to the provider list', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      title: 'Home Maintenance & Repair',
    });

    const { getByText } = render(<CategoryDetailsScreen />);

    fireEvent.press(getByText('Electrical'));

    expect(mockPush).toHaveBeenCalledWith({
      pathname: '/provider-list',
      params: { serviceName: 'Electrical' },
    });
  });
});
