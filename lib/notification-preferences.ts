import AsyncStorage from '@react-native-async-storage/async-storage';

export type NotificationRole = 'customer' | 'provider';

export type CustomerNotificationPreferences = {
  bookingUpdates: boolean;
  promotions: boolean;
  messages: boolean;
  reminders: boolean;
};

export type ProviderNotificationPreferences = {
  newBooking: boolean;
  bookingConfirmation: boolean;
  bookingCancellation: boolean;
  bookingModification: boolean;
  customerMessages: boolean;
  paymentReceived: boolean;
  payoutProcessed: boolean;
  promotionalOffers: boolean;
  platformUpdates: boolean;
  dailySummary: boolean;
};

const buildPreferenceKey = (role: NotificationRole, userId: string) =>
  `notification-preferences:${role}:${userId}`;

const defaultCustomerPreferences: CustomerNotificationPreferences = {
  bookingUpdates: true,
  promotions: false,
  messages: true,
  reminders: true,
};

const defaultProviderPreferences: ProviderNotificationPreferences = {
  newBooking: true,
  bookingConfirmation: true,
  bookingCancellation: true,
  bookingModification: true,
  customerMessages: true,
  paymentReceived: true,
  payoutProcessed: true,
  promotionalOffers: false,
  platformUpdates: true,
  dailySummary: true,
};

const readJson = async <T>(key: string, fallback: T): Promise<T> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
};

const writeJson = async <T>(key: string, value: T) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep UI responsive even if local persistence is unavailable.
  }
};

export const loadCustomerNotificationPreferences = async (userId: string) =>
  readJson(buildPreferenceKey('customer', userId), defaultCustomerPreferences);

export const saveCustomerNotificationPreferences = async (
  userId: string,
  preferences: CustomerNotificationPreferences
) => writeJson(buildPreferenceKey('customer', userId), preferences);

export const loadProviderNotificationPreferences = async (userId: string) =>
  readJson(buildPreferenceKey('provider', userId), defaultProviderPreferences);

export const saveProviderNotificationPreferences = async (
  userId: string,
  preferences: ProviderNotificationPreferences
) => writeJson(buildPreferenceKey('provider', userId), preferences);

export const areMessageNotificationsEnabled = async (
  userId: string,
  role: NotificationRole
) => {
  if (!userId) return true;

  if (role === 'customer') {
    const preferences = await loadCustomerNotificationPreferences(userId);
    return preferences.messages;
  }

  const preferences = await loadProviderNotificationPreferences(userId);
  return preferences.customerMessages;
};
