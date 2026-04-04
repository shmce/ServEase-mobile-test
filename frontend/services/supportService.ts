import { api } from '../lib/apiClient';
import { SupportTicket } from '../src/types/database.interfaces';

export const createSupportTicket = async (input: {
  userId: string;
  subject: string;
  message: string;
  category?: string;
  role?: 'customer' | 'provider';
}) => {
  const { ticket } = await api.post<{ ticket: SupportTicket }>('/users/support-tickets', {
    subject: input.subject,
    message: input.message,
    category: input.category,
    role: input.role,
  });
  return ticket;
};

export const createCustomerSupportTicket = async (
  userId: string,
  subject: string,
  message: string,
  category?: string
) =>
  createSupportTicket({
    userId,
    subject,
    message,
    category,
    role: 'customer',
  });

export const createProviderSupportTicket = async (
  userId: string,
  subject: string,
  message: string,
  category?: string
) =>
  createSupportTicket({
    userId,
    subject,
    message,
    category,
    role: 'provider',
  });
