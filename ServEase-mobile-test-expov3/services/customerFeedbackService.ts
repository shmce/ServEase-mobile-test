import { bookingDb, trustDb, providerCatalogDb } from '../lib/db';
import { getErrorMessage } from '../lib/error-handling';

const formatDbError = (error: any, fallback: string) => {
  const base = getErrorMessage(error, fallback);
  const code = error?.code ? ` [${error.code}]` : '';
  const details = error?.details ? `\n${error.details}` : '';
  const hint = error?.hint ? `\nHint: ${error.hint}` : '';
  return `${base}${code}${details}${hint}`;
};

export const submitCustomerReview = async (input: {
  bookingId: string;
  reviewerId: string;
  providerId: string;
  rating: number;
  reviewText: string;
}) => {
  const bookingId = String(input.bookingId || '').trim();
  const reviewerId = String(input.reviewerId || '').trim();
  const providerId = String(input.providerId || '').trim();
  const rating = Number(input.rating || 0);

  if (!bookingId || !reviewerId || !providerId) {
    throw new Error('Missing booking, customer, or provider details for this review.');
  }
  if (rating < 1 || rating > 5) {
    throw new Error('Ratings must be between 1 and 5 stars.');
  }

  const { data: booking, error: bookingError } = await bookingDb
    .from('bookings')
    .select('id,customer_id,provider_id,status')
    .eq('id', bookingId)
    .maybeSingle();

  if (bookingError) {
    throw new Error(formatDbError(bookingError, 'Failed to verify this booking.'));
  }
  if (!booking) {
    throw new Error('Booking not found.');
  }
  if (String(booking.customer_id) !== reviewerId || String(booking.provider_id) !== providerId) {
    throw new Error('This review does not match the selected booking.');
  }

  const normalizedStatus = String(booking.status || '').trim().toLowerCase();
  if (!normalizedStatus.includes('complete') && normalizedStatus !== 'done') {
    throw new Error('You can only review completed bookings.');
  }

  const payload = {
    booking_id: bookingId,
    reviewer_id: reviewerId,
    reviewee_id: providerId,
    rating,
    review_text: String(input.reviewText || '').trim() || null,
  };

  const { data: review, error: reviewError } = await trustDb
    .from('reviews')
    .upsert(payload, { onConflict: 'booking_id,reviewer_id' })
    .select('*')
    .maybeSingle();

  if (reviewError) {
    throw new Error(formatDbError(reviewError, 'Failed to submit review.'));
  }

  const { data: allReviews, error: reviewsError } = await trustDb
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', providerId);

  if (reviewsError) {
    throw new Error(formatDbError(reviewsError, 'Review saved, but provider stats could not be refreshed.'));
  }

  const ratings = (allReviews || []).map((entry: any) => Number(entry.rating || 0)).filter((value) => value > 0);
  const totalReviews = ratings.length;
  const averageRating = totalReviews
    ? Number((ratings.reduce((sum, value) => sum + value, 0) / totalReviews).toFixed(2))
    : 0;

  try {
    await providerCatalogDb.rpc('update_provider_rating', {
      p_provider_id: providerId,
      p_average_rating: averageRating,
      p_total_reviews: totalReviews,
    });
  } catch {
    // Fallback: direct upsert (will fail if customer lacks RLS permission on provider_profiles)
    const { error: profileError } = await providerCatalogDb
      .from('provider_profiles')
      .upsert({
        user_id: providerId,
        average_rating: averageRating,
        total_reviews: totalReviews,
      });

    if (profileError) {
      console.warn('Review saved, but provider rating stats could not be updated:', profileError.message);
    }
  }

  return review;
};

export const submitProviderProfileReport = async (input: {
  providerId: string;
  reporterId: string;
  reason: string;
  details: string;
  bookingId?: string;
}) => {
  const providerId = String(input.providerId || '').trim();
  const reporterId = String(input.reporterId || '').trim();
  const reason = String(input.reason || '').trim();

  if (!providerId || !reporterId) {
    throw new Error('Missing provider or reporter details for this report.');
  }
  if (!reason) {
    throw new Error('Please choose a report reason.');
  }

  const payload = {
    provider_id: providerId,
    reporter_id: reporterId,
    booking_id: String(input.bookingId || '').trim() || null,
    reason,
    details: String(input.details || '').trim() || null,
    status: 'submitted',
  };

  const { data, error } = await trustDb
    .from('provider_profile_reports')
    .insert(payload)
    .select('*')
    .maybeSingle();

  if (error) {
    throw new Error(formatDbError(error, 'Failed to submit provider profile report.'));
  }

  return data;
};
