import {
  Controller,
  Body,
  Get,
  Patch,
  Post,
  Version,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { UserProfileDto } from './dto/user-profile.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Version('1')
  @Get('profile')
  @UseGuards(SupabaseAuthGuard)
  async getProfile(
    @Req() req: { user: { id: string } },
  ): Promise<UserProfileDto> {
    const userId = req.user.id;
    return this.usersService.getProfile(userId);
  }

  @Version('1')
  @Patch('profile')
  @UseGuards(SupabaseAuthGuard)
  async updateProfile(
    @Req() req: { user: { id: string } },
    @Body() body: Partial<UserProfileDto>,
  ) {
    const userId = req.user.id;
    return this.usersService.updateProfile(userId, body);
  }

  @Version('1')
  @Post('support-tickets')
  async submitSupportTicket(
    @Req() req: { user: { id: string } },
    @Body()
    body: {
      subject: string;
      message: string;
      category?: string;
      role?: 'customer' | 'provider';
    },
  ) {
    const userId = req.user.id;
    return this.usersService.submitSupportTicket({
      userId,
      subject: body.subject,
      message: body.message,
      category: body.category,
      role: body.role,
    });
  }
}
