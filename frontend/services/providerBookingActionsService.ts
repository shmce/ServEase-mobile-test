import { api } from '../lib/apiClient';

export type ProviderRescheduleRequestInput = {
  bookingId: string;
  providerId: string;
  reason: string;
  explanation: string;
  proposedDate: string;
  proposedTime: string;
};

export type ProviderAdditionalChargeItemInput = {
  description: string;
  amount: number;
};

export type ProviderAdditionalChargeRequestInput = {
  bookingId: string;
  providerId: string;
  justification: string;
  items: ProviderAdditionalChargeItemInput[];
};

export type BookingRescheduleRequestRow = {
  id: string;
  booking_id: string;
  provider_id: string;
  reason: string;
  explanation: string;
  proposed_date: string;
  proposed_time: string;
  status: string;
  created_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
};

export type AdditionalChargeRow = {
  id: string;
  booking_id: string;
  requested_by: string;
  description: string;
  amount: number;
  justification?: string | null;
  status: string;
  created_at: string;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
};

export const createProviderRescheduleRequest = async (input: ProviderRescheduleRequestInput) => {
  const { request } = await api.post<{ request: BookingRescheduleRequestRow }>('/provider/reschedule-requests', {
    bookingId: input.bookingId, providerId: input.providerId, reason: input.reason,
    explanation: input.explanation, proposedDate: input.proposedDate, proposedTime: input.proposedTime,
  });
  return request;
};

export const getProviderRescheduleRequests = async (bookingId: string) => {
  const { requests } = await api.get<{ requests: BookingRescheduleRequestRow[] }>(`/provider/reschedule-requests/${bookingId}`);
  return requests;
};

export const createProviderAdditionalChargeRequest = async (input: ProviderAdditionalChargeRequestInput) => {
  const { charges } = await api.post<{ charges: AdditionalChargeRow[] }>('/provider/additional-charges', {
    bookingId: input.bookingId, providerId: input.providerId, justification: input.justification, items: input.items,
  });
  return charges;
};

export const getProviderAdditionalChargeRequests = async (bookingId: string) => {
  const { charges } = await api.get<{ charges: AdditionalChargeRow[] }>(`/provider/additional-charges/${bookingId}`);
  return charges;
};

export const reviewRescheduleRequest = async (input: { requestId: string; bookingId: string; customerId: string; decision: 'approved' | 'declined' }) => {
  const { request } = await api.patch<{ request: BookingRescheduleRequestRow }>(
    `/provider/reschedule-requests/${input.requestId}/review`,
    { bookingId: input.bookingId, customerId: input.customerId, decision: input.decision },
  );
  return request;
};

export const reviewAdditionalChargeRequest = async (input: { bookingId: string; customerId: string; chargeIds: string[]; decision: 'approved' | 'declined' }) => {
  const { charges } = await api.patch<{ charges: AdditionalChargeRow[] }>('/provider/additional-charges/review', input);
  return charges;
};
