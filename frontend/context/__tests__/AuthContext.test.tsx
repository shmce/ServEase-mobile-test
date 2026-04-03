import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { AuthProvider, AuthContext } from '../AuthContext';
import { supabase } from '../../lib/supabase';
import { Text } from 'react-native';

const TestComponent = () => {
  const { user, isLoading } = React.useContext(AuthContext);
  if (isLoading) return <Text>Loading...</Text>;
  return <Text>{user ? user.email : 'No User'}</Text>;
};

describe('AuthProvider', () => {
  it('loads the session on mount and provides user data', async () => {
    const mockUser = { email: 'test@example.com' };
    
    (supabase.auth.getSession as jest.Mock).mockResolvedValueOnce({
      data: { session: { user: mockUser } },
      error: null,
    });

    const { getByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(getByText('Loading...')).toBeTruthy();

    await waitFor(() => {
      expect(getByText('test@example.com')).toBeTruthy();
    });
  });

  it('updates the user when auth state changes', async () => {
    let authChangeCallback: any;
    
    (supabase.auth.onAuthStateChange as jest.Mock).mockImplementation((callback) => {
      authChangeCallback = callback;
      return { data: { subscription: { unsubscribe: jest.fn() } } };
    });

    const { getByText, queryByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Initial state (No User after loading)
    await waitFor(() => expect(queryByText('Loading...')).toBeNull());
    
    // Trigger auth change
    authChangeCallback('SIGNED_IN', { user: { email: 'new@example.com' } });

    await waitFor(() => {
      expect(getByText('new@example.com')).toBeTruthy();
    });
  });
});
