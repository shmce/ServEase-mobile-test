import { Injectable, BadRequestException } from '@nestjs/common';
import { UserProfileDto } from './dto/user-profile.dto';
import { UserRepository } from './repositories/user.repository';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async getProfile(userId: string): Promise<UserProfileDto> {
    return this.userRepository.findById(userId);
  }

  async updateProfile(userId: string, updates: Partial<UserProfileDto>) {
    const allowed: (keyof UserProfileDto)[] = ['full_name', 'contact_number'];
    const payload = Object.fromEntries(
      Object.entries(updates).filter(([key]) => allowed.includes(key as keyof UserProfileDto))
    );

    if (!Object.keys(payload).length) throw new BadRequestException('No valid fields to update.');

    return this.userRepository.update(userId, payload);
  }
}

