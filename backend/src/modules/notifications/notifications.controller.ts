import {
  Controller,
  Get,
  Patch,
  Param,
  Req,
  UnauthorizedException,
  Version,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { NotificationsService } from './notifications.service';
import { AppAuthGuard } from '../auth/guards/app-auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  private getAuthUserId(req: Request & { authUser?: { sub?: string } }) {
    const userId = String(req.authUser?.sub || '').trim();
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired token.');
    }
    return userId;
  }

  @Version('1')
  @UseGuards(AppAuthGuard)
  @Get()
  async getNotifications(@Req() req: Request) {
    const userId = this.getAuthUserId(
      req as Request & { authUser?: { sub?: string } },
    );
    return this.notificationsService.getNotifications(userId);
  }

  // MUST come before /:id/read to avoid route conflict
  @Version('1')
  @UseGuards(AppAuthGuard)
  @Patch('read-all')
  async markAllRead(@Req() req: Request) {
    const userId = this.getAuthUserId(
      req as Request & { authUser?: { sub?: string } },
    );
    return this.notificationsService.markAllRead(userId);
  }

  @Version('1')
  @UseGuards(AppAuthGuard)
  @Patch(':id/read')
  async markRead(@Param('id') id: string, @Req() req: Request) {
    const userId = this.getAuthUserId(
      req as Request & { authUser?: { sub?: string } },
    );
    return this.notificationsService.markRead(userId, id);
  }

  @Version('1')
  @UseGuards(AppAuthGuard)
  @Get('unread-count')
  async getUnreadCount(@Req() req: Request) {
    const userId = this.getAuthUserId(
      req as Request & { authUser?: { sub?: string } },
    );
    return this.notificationsService.getUnreadCount(userId);
  }
}
