import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Req,
  UnauthorizedException,
  Version,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { AppAuthGuard } from '../auth/guards/app-auth.guard';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  private getAuthUserId(req: Request & { authUser?: { sub?: string } }) {
    const userId = String(req.authUser?.sub || '').trim();
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired token.');
    }
    return userId;
  }

  @Version('1')
  @UseGuards(AppAuthGuard)
  @Get('conversations')
  async getConversations(@Query('role') role: string, @Req() req: Request) {
    const userId = this.getAuthUserId(
      req as Request & { authUser?: { sub?: string } },
    );
    const chatRole = role === 'provider' ? 'provider' : 'customer';
    return this.chatService.getConversations(userId, chatRole);
  }

  @Version('1')
  @UseGuards(AppAuthGuard)
  @Get('conversations/:bookingId/messages')
  async getThread(@Param('bookingId') bookingId: string, @Req() req: Request) {
    const userId = this.getAuthUserId(
      req as Request & { authUser?: { sub?: string } },
    );
    return this.chatService.getThread(bookingId, userId);
  }

  @Version('1')
  @UseGuards(AppAuthGuard)
  @Post('conversations/:bookingId/messages')
  async sendMessage(
    @Param('bookingId') bookingId: string,
    @Body() dto: SendMessageDto,
    @Req() req: Request,
  ) {
    const userId = this.getAuthUserId(
      req as Request & { authUser?: { sub?: string } },
    );
    return this.chatService.sendMessage(bookingId, userId, dto.text);
  }

  @Version('1')
  @UseGuards(AppAuthGuard)
  @Patch('conversations/:bookingId/read')
  async markThreadRead(
    @Param('bookingId') bookingId: string,
    @Req() req: Request,
  ) {
    const userId = this.getAuthUserId(
      req as Request & { authUser?: { sub?: string } },
    );
    return this.chatService.markThreadRead(bookingId, userId);
  }
}
