/**
 * Centralized default values and UI constants to avoid hardcoding strings and values in components.
 */

export const ASSETS = {
  IMAGES: {
    CATEGORY_FALLBACK: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400',
    HERO_FALLBACK: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=800',
    AVATAR_FALLBACK: (id: string) => `https://i.pravatar.cc/150?u=${id}`,
  },
};

export const PLACEHOLDERS = {
  EMAIL: 'your.email@example.com',
  NAME: 'e.g. John Doe',
  PHONE: '9XX XXX XXXX',
  REFERRAL: 'Enter referral code',
  PASSWORD: '••••••••',
  SEARCH: 'Search services...',
  BOOKING_NOTES: 'e.g. Please bring a ladder...',
};

export const BUSINESS_CONFIG = {
  BOOKABLE_DAYS_COUNT: 21,
  DEFAULT_CANCELLATION_FEE_PHP: 150,
  SUPPORT_EMAIL: 'support@servease.com',
};

export const UI_LABELS = {
  EXPLORE_SERVICES: 'Explore Services',
  VERIFIED: 'Verified',
  FROM_PRICE: 'From',
};
