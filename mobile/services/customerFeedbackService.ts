import { api } from '../lib/apiClient';
import { ProviderReview } from '../src/types/database.interfaces';

export const submitCustomerReview = async (input: {
  bookingId: string;
  reviewerId: string;
  providerId: string;
  rating: number;
  reviewText: string;
}): Promise<ProviderReview> => {
  const { review } = await api.post<{ review: ProviderReview }>('/provider/reviews', {
    booking_id: input.bookingId,
    reviewer_id: input.reviewerId,
    reviewee_id: input.providerId,
    rating: input.rating,
    review_text: input.reviewText,
  });
  return review;
};

export const submitProviderProfileReport = async (input: {
  providerId: string;
  reporterId: string;
  reason: string;
  details: string;
  bookingId?: string;
}) => {
  return api.post('/provider/reports', {
    provider_id: input.providerId,
    reporter_id: input.reporterId,
    reason: input.reason,
    details: input.details,
    booking_id: input.bookingId,
  });
};

export const submitProviderReview = async (input: {
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  review_text?: string;
}): Promise<ProviderReview> => {
  const { review } = await api.post<{ review: ProviderReview }>('/provider/reviews', input);
  return review;
};
