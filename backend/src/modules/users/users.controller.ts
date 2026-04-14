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
import { UserProfileDto } from './dto/user-profile.dto';
import { AppAuthGuard } from '../auth/guards/app-auth.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Version('1')
  @Get('profile')
  @UseGuards(AppAuthGuard)
  async getProfile(
    @Req() req: { authUser: { sub: string } },
  ): Promise<UserProfileDto> {
    const userId = req.authUser.sub;
    return this.usersService.getProfile(userId);
  }

  @Version('1')
  @Patch('profile')
  @UseGuards(AppAuthGuard)
  async updateProfile(
    @Req() req: { authUser: { sub: string } },
    @Body() body: Partial<UserProfileDto>,
  ) {
    const userId = req.authUser.sub;
    return this.usersService.updateProfile(userId, body);
  }

  @Version('1')
  @Post('support-tickets')
  @UseGuards(AppAuthGuard)
  async submitSupportTicket(
    @Req() req: { authUser: { sub: string } },
    @Body()
    body: {
      subject: string;
      message: string;
      category?: string;
      role?: 'customer' | 'provider';
    },
  ) {
    const userId = req.authUser.sub;
    return this.usersService.submitSupportTicket({
      userId,
      subject: body.subject,
      message: body.message,
      category: body.category,
      role: body.role,
    });
  }
}
