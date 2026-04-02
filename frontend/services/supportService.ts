import { notificationDb } from '../lib/db';
import { getErrorMessage } from '../lib/error-handling';

const createUuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : ((r & 0x3) | 0x8);
    return v.toString(16);
  });

const tryInsertSupportTicket = async (payload: Record<string, any>) => {
  const variants = [
    payload,
    {
      ticket_id: payload.ticket_id,
      user_id: payload.user_id,
      subject: payload.subject,
      message: payload.message,
    },
  ];

  for (const variant of variants) {
    const { data, error } = await notificationDb.from('support_tickets').insert(variant).select('*').maybeSingle();
    if (!error && data) return data;
  }

  return null;
};

export const createSupportTicket = async (input: {
  userId: string;
  subject: string;
  message: string;
  category?: string;
  role?: 'customer' | 'provider';
}) => {
  const userId = String(input.userId || '').trim();
  const subject = String(input.subject || '').trim();
  const message = String(input.message || '').trim();

  if (!userId || !subject || !message) {
    throw new Error('Support tickets need a user, subject, and message.');
  }

  const ticket = await tryInsertSupportTicket({
    ticket_id: createUuid(),
    user_id: userId,
    subject,
    message,
    category: String(input.category || '').trim() || null,
    requester_role: input.role || null,
    status: 'open',
  });

  if (!ticket) {
    throw new Error(getErrorMessage(null, 'Failed to submit support ticket.'));
  }

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
