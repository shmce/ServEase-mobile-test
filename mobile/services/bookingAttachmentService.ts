import { bookingDb } from '../lib/db';
import { getErrorMessage } from '../lib/error-handling';
import { api } from '../lib/apiClient';

export const BOOKING_ATTACHMENTS_BUCKET = 'booking-attachments';

export type BookingAttachmentDraft = {
  uri: string;
  label: string;
  storagePath?: string | null;
};

export type BookingAttachmentRow = {
  id: string;
  booking_id: string;
  file_url: string;
  file_name: string | null;
  mime_type: string | null;
  created_at?: string | null;
};

export const normalizeAttachmentDraft = (draft: BookingAttachmentDraft) => ({
  uri: String(draft.uri || '').trim(),
  label: String(draft.label || '').trim(),
  storagePath: String(draft.storagePath || '').trim() || null,
});

const sanitizeFileName = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replaceAll(/[^a-z0-9._-]+/g, '-')
    .replaceAll(/^-+|-+$/g, '') || `attachment-${Date.now()}.jpg`;

const guessMimeType = (uri: string) => {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  return 'image/jpeg';
};

export const uploadBookingAttachment = async (input: {
  bookingId: string;
  userId: string;
  uri: string;
  fileName?: string;
}) => {
  const fileName = sanitizeFileName(input.fileName || input.uri.split('/').pop() || '');
  const mimeType = guessMimeType(input.uri);

  const formData = new FormData();
  formData.append('file', {
    uri: input.uri,
    name: fileName,
    type: mimeType,
  } as any);
  formData.append('label', fileName);

  const result = await api.postForm<{ id: string; public_url: string; label: string; storage_path: string }>(
    `/uploads/booking/${input.bookingId}/attachment`,
    formData,
  );

  return {
    publicUrl: result.public_url,
    storagePath: result.storage_path,
    mimeType,
    fileName: result.label,
  };
};

export const saveBookingAttachments = async (
  bookingId: string,
  attachments: BookingAttachmentDraft[]
) => {
  const normalized = attachments
    .map(normalizeAttachmentDraft)
    .filter((attachment) => attachment.uri);

  if (!normalized.length) return [] as BookingAttachmentRow[];

  const payload = normalized.map((attachment, index) => ({
    booking_id: bookingId,
    file_url: attachment.uri,
    file_name: attachment.label || `Attachment ${index + 1}`,
    mime_type: guessMimeType(attachment.uri),
    storage_path: attachment.storagePath,
  }));

  try {
    const { data, error } = await bookingDb
      .from('booking_attachments')
      .insert(payload as any)
      .select('id,booking_id,file_url,file_name,mime_type,created_at');

    if (error) throw error;
    return (data || []) as BookingAttachmentRow[];
  } catch (error) {
    throw new Error(getErrorMessage(error, 'Failed to save booking attachments.'));
  }
};

export const getBookingAttachments = async (bookingId: string) => {
  try {
    const { attachments } = await api.get<{ attachments: BookingAttachmentRow[] }>(`/booking/${bookingId}/attachments`);
    return attachments || [];
  } catch {
    return [] as BookingAttachmentRow[];
  }
};
