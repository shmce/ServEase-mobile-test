import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
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
  async getProfile(@Req() req: any): Promise<UserProfileDto> {
    return this.usersService.getProfile(req.user.id);
  }

  @Version('1')
  @Patch('profile')
  @UseGuards(SupabaseAuthGuard)
  async updateProfile(@Req() req: any, @Body() body: Partial<UserProfileDto>) {
    return this.usersService.updateProfile(req.user.id, body);
  }

  @Version('1')
  @Post('support-tickets')
  async submitSupportTicket(
    @Body()
    body: {
      userId?: string;
      subject: string;
      message: string;
      category?: string;
      role?: 'customer' | 'provider';
    },
    @Req() req: any,
  ) {
    return this.usersService.submitSupportTicket({
      userId: req.user.id,
      subject: body.subject,
      message: body.message,
      category: body.category,
      role: body.role,
    });
  }
}
