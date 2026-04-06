import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  Req,
  UnauthorizedException,
  Version,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { AppAuthGuard } from '../auth/guards/app-auth.guard';

@Controller('booking')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly supabase: SupabaseClient,
  ) {}

  private getAuthUserId(req: Request & { authUser?: { sub?: string } }) {
    const userId = String(req.authUser?.sub || '').trim();
    if (!userId) {
      throw new UnauthorizedException('Invalid or expired token.');
    }
    return userId;
  }

  private assertSameUser(
    req: Request & { authUser?: { sub?: string } },
    userId: string,
  ) {
    const actorId = this.getAuthUserId(req);
    if (actorId !== userId) {
      throw new ForbiddenException('You can only access your own bookings.');
    }
    return actorId;
  }

  @Version('1')
  @UseGuards(AppAuthGuard)
  @Post('create')
  async createBooking(@Body() dto: CreateBookingDto, @Req() req: Request) {
    const userId = this.getAuthUserId(
      req as Request & { authUser?: { sub?: string } },
    );
    return this.bookingService.createBooking(dto, userId);
  }

  @Version('1')
  @UseGuards(AppAuthGuard)
  @Get('customer')
  async getOwnCustomerBookings(@Req() req: Request) {
    const userId = this.getAuthUserId(
      req as Request & { authUser?: { sub?: string } },
    );
    return this.bookingService.getCustomerBookings(userId);
  }

  @Version('1')
  @UseGuards(AppAuthGuard)
  @Get('customer/:customerId')
  async getCustomerBookings(
    @Param('customerId') customerId: string,
    @Req() req: Request,
  ) {
    this.assertSameUser(
      req as Request & { authUser?: { sub?: string } },
      customerId,
    );
    return this.bookingService.getCustomerBookings(customerId);
  }

  @Version('1')
  @UseGuards(AppAuthGuard)
  @Get(':bookingId/attachments')
  getBookingAttachments(@Param('bookingId') bookingId: string) {
    return this.bookingService.getBookingAttachments(bookingId);
  }

  @Version('1')
  @Get('history')
  async getHistory() {
    return this.bookingService.getHistory();
  }

  @Version('1')
  @Get('requests')
  async getRequests() {
    return this.bookingService.getRequests();
  }

  @Version('1')
  @Get(':id')
  async getBookingById(@Param('id') id: string) {
    return this.bookingService.getBookingById(id);
  }

  @Version('1')
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateBookingStatusDto,
  ) {
    return this.bookingService.updateStatus(id, dto.status);
  }

  @Version('1')
  @UseGuards(AppAuthGuard)
  @Patch(':id/cancel')
  async cancelBooking(
    @Param('id') id: string,
    @Body() body: { reason?: string; explanation?: string },
    @Req() req: Request,
  ) {
    const userId = this.getAuthUserId(
      req as Request & { authUser?: { sub?: string } },
    );
    return this.bookingService.cancelBooking(
      id,
      userId,
      body.reason || '',
      body.explanation || '',
    );
  }

  @Version('1')
  @UseGuards(AppAuthGuard)
  @Post(':id/disputes')
  async createDispute(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: Request,
  ) {
    const userId = this.getAuthUserId(
      req as Request & { authUser?: { sub?: string } },
    );
    return this.bookingService.createDispute(id, userId, body.reason);
  }
}
