import {
  Injectable,
  BadRequestException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { NOTIFICATION_CLIENT } from '../../database/supabase.module';
import { handleSupabaseError } from '../../common/utils/supabase-error.handler';
import { UserProfileDto } from './dto/user-profile.dto';
import { UserRepository } from './repositories/user.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    @Inject(NOTIFICATION_CLIENT)
    private readonly notificationDb: SupabaseClient,
  ) {}

  async getProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.userRepository.findById<UserProfileDto>(userId);
    if (!user) throw new NotFoundException('Profile not found.');
    return user;
  }

  async updateProfile(userId: string, updates: Partial<UserProfileDto>) {
    const allowed = new Set<keyof UserProfileDto>([
      'full_name',
      'contact_number',
    ]);
    const payload = Object.fromEntries(
      Object.entries(updates).filter(([key]) =>
        allowed.has(key as keyof UserProfileDto),
      ),
    );

    if (!Object.keys(payload).length)
      throw new BadRequestException('No valid fields to update.');

    const updated = await this.userRepository.update<UserProfileDto>(
      userId,
      payload,
    );
    if (!updated) throw new BadRequestException('Update failed.');
    return updated;
  }

  async submitSupportTicket(input: {
    userId: string;
    subject: string;
    message: string;
    category?: string;
    role?: 'customer' | 'provider';
  }) {
    if (!input.userId || !input.subject || !input.message) {
      throw new BadRequestException(
        'Support tickets need a user, subject, and message.',
      );
    }

    const { data, error } = await this.notificationDb
      .from('support_tickets')
      .insert({
        user_id: input.userId,
        subject: input.subject,
        message: input.message,
        category: input.category || null,
        requester_role: input.role || null,
        status: 'open',
      })
      .select('*')
      .maybeSingle();

    if (error) handleSupabaseError(error, 'SupportTicket');
    return { ticket: data };
  }
}
