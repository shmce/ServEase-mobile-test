import { Controller, Post, Get, Patch, Param, Body, Req, UnauthorizedException, Version } from '@nestjs/common';
import type { Request } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';

@Controller('booking')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly supabase: SupabaseClient,
  ) {}

  private async getUserFromRequest(req: Request) {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw new UnauthorizedException('No token provided.');
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await this.supabase.auth.getUser(token);
    if (error || !user) throw new UnauthorizedException('Invalid or expired token.');
    return user;
  }

  @Version('1')
  @Post('create')
  async createBooking(@Body() dto: CreateBookingDto, @Req() req: Request) {
    const user = await this.getUserFromRequest(req);
    return this.bookingService.createBooking(dto, user.id);
  }

  @Version('1')
  @Get('customer/:customerId')
  async getCustomerBookings(@Param('customerId') customerId: string) {
    return this.bookingService.getCustomerBookings(customerId);
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
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.bookingService.updateStatus(id, dto.status);
  }

  @Version('1')
  @Patch(':id/cancel')
  async cancelBooking(
    @Param('id') id: string,
    @Body() body: { reason?: string; explanation?: string },
    @Req() req: Request,
  ) {
    const user = await this.getUserFromRequest(req);
    return this.bookingService.cancelBooking(id, user.id, body.reason || '', body.explanation || '');
  }
}

