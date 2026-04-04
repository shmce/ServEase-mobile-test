import { api } from '../lib/apiClient';

export const submitCustomerReview = async (input: {
  bookingId: string;
  reviewerId: string;
  providerId: string;
  rating: number;
  reviewText: string;
}) => {
  return api.post('/provider/reviews', {
    booking_id: input.bookingId,
    reviewer_id: input.reviewerId,
    reviewee_id: input.providerId,
    rating: input.rating,
    review_text: input.reviewText,
  });
};

export const submitProviderProfileReport = async (input: {
  providerId: string;
  reporterId: string;
  reason: string;
  details: string;
  bookingId?: string;
}) => {
  return api.post('/provider/reports', {
    providerId: input.providerId,
    reporterId: input.reporterId,
    reason: input.reason,
    details: input.details,
    bookingId: input.bookingId,
  });
};

export const submitProviderReview = async (input: {
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  review_text?: string;
}) => {
  return api.post('/provider/reviews', input);
};
