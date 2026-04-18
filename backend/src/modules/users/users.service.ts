import {
  Injectable,
  BadRequestException,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { NOTIFICATION_CLIENT } from '../../database/supabase.module';
import { getMaybeSingle } from '../../common/utils/database.utils';
import { UserProfileDto } from './dto/user-profile.dto';
import { UserRepository } from './repositories/user.repository';
import { SupportTicket } from '../../common/interfaces/database.interfaces';

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
    console.log('=== UserService.updateProfile Called ===');
    console.log('User ID:', userId);
    console.log('Raw updates:', JSON.stringify(updates));
    
    const allowed = new Set<keyof UserProfileDto>([
      'full_name',
      'contact_number',
    ]);
    const payload = Object.fromEntries(
      Object.entries(updates).filter(([key]) =>
        allowed.has(key as keyof UserProfileDto),
      ),
    );

    console.log('Filtered payload:', JSON.stringify(payload));

    if (!Object.keys(payload).length) {
      console.log('Error: No valid fields to update');
      throw new BadRequestException('No valid fields to update.');
    }

    console.log('Calling userRepository.update with:', JSON.stringify(payload));
    const updated = await this.userRepository.update<UserProfileDto>(
      userId,
      payload,
    );
    
    console.log('Repository returned:', JSON.stringify(updated));
    if (!updated) {
      console.log('Error: Update returned null/undefined');
      throw new BadRequestException('Update failed.');
    }
    
    console.log('=== UserService.updateProfile Complete ===');
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

    const ticket = await getMaybeSingle<SupportTicket>(
      this.notificationDb
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
        .maybeSingle(),
      'SupportTicketSubmit',
    );

    return { ticket };
  }
}
