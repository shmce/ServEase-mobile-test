import {
  Injectable,
  Inject,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { CATALOG_CLIENT, BOOKING_CLIENT } from '../../database/supabase.module';

@Injectable()
export class UploadsService {
  constructor(
    private readonly supabase: SupabaseClient,
    @Inject(CATALOG_CLIENT) private readonly catalogDb: SupabaseClient,
    @Inject(BOOKING_CLIENT) private readonly bookingDb: SupabaseClient,
  ) {}

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided.');

    if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG and PNG images are allowed.',
      );
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('File size must not exceed 5 MB.');
    }

    const ext = file.mimetype === 'image/png' ? 'png' : 'jpg';
    const storagePath = `${userId}.${ext}`;

    const { error: uploadError } = await this.supabase.storage
      .from('avatars')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      throw new InternalServerErrorException(uploadError.message);
    }

    const publicUrl = this.supabase.storage
      .from('avatars')
      .getPublicUrl(storagePath).data.publicUrl;

    const { error: updateError } = await this.catalogDb
      .from('provider_profiles')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (updateError) {
      throw new InternalServerErrorException(updateError.message);
    }

    return { avatar_url: publicUrl };
  }

  async uploadBookingAttachment(
    bookingId: string,
    userId: string,
    file: Express.Multer.File,
    label?: string,
  ) {
    if (!file) throw new BadRequestException('No file provided.');

    if (
      !['image/jpeg', 'image/png', 'application/pdf'].includes(file.mimetype)
    ) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and PDF files are allowed.',
      );
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size must not exceed 10 MB.');
    }

    // Verify booking ownership
    const { data: booking, error: bookingError } = await this.bookingDb
      .from('bookings')
      .select('id')
      .eq('id', bookingId)
      .or(`customer_id.eq.${userId},provider_id.eq.${userId}`)
      .maybeSingle();

    if (bookingError)
      throw new InternalServerErrorException(bookingError.message);
    if (!booking)
      throw new NotFoundException('Booking not found or access denied.');

    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'application/pdf': 'pdf',
    };
    const ext = extMap[file.mimetype] ?? 'bin';
    const storagePath = `${bookingId}/${userId}-${Date.now()}.${ext}`;

    const { error: uploadError } = await this.supabase.storage
      .from('booking-attachments')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      throw new InternalServerErrorException(uploadError.message);
    }

    const publicUrl = this.supabase.storage
      .from('booking-attachments')
      .getPublicUrl(storagePath).data.publicUrl;

    const { data: inserted, error: insertError } = await this.bookingDb
      .from('booking_attachments')
      .insert({
        booking_id: bookingId,
        file_url: publicUrl,
        file_name: label || file.originalname,
        mime_type: file.mimetype,
        storage_path: storagePath,
      })
      .select('id')
      .single();

    if (insertError)
      throw new InternalServerErrorException(insertError.message);

    return {
      id: (inserted as { id: string }).id,
      public_url: publicUrl,
      label: label || file.originalname,
      storage_path: storagePath,
    };
  }

  async uploadVerificationDocument(
    userId: string,
    file: Express.Multer.File,
    documentType: string,
  ) {
    if (!file) throw new BadRequestException('No file provided.');

    if (
      !['image/jpeg', 'image/png', 'application/pdf'].includes(file.mimetype)
    ) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, and PDF files are allowed.',
      );
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestException('File size must not exceed 10 MB.');
    }

    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'application/pdf': 'pdf',
    };
    const ext = extMap[file.mimetype] ?? 'bin';
    const storagePath = `${userId}/${documentType}-${Date.now()}.${ext}`;

    const { error: uploadError } = await this.supabase.storage
      .from('provider-documents')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      throw new InternalServerErrorException(uploadError.message);
    }

    const publicUrl = this.supabase.storage
      .from('provider-documents')
      .getPublicUrl(storagePath).data.publicUrl;

    const { error: upsertError } = await this.catalogDb
      .from('provider_verification')
      .upsert(
        {
          provider_id: userId,
          document_type: documentType,
          document_url: publicUrl,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'provider_id,document_type' },
      );

    if (upsertError)
      throw new InternalServerErrorException(upsertError.message);

    return { public_url: publicUrl, document_type: documentType };
  }
}
