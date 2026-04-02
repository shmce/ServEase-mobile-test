import { Controller, Get, Post, Patch, Body, Param, Version } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Version('1')
  @Post('create')
  createPayment(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.createPayment(dto);
  }

  @Version('1')
  @Get('earnings/:provider_id')
  getEarnings(@Param('provider_id') providerId: string) {
    return this.paymentsService.getEarnings(providerId);
  }

  @Version('1')
  @Get('booking/:bookingId')
  getPaymentByBookingId(@Param('bookingId') bookingId: string) {
    return this.paymentsService.getPaymentByBookingId(bookingId);
  }

  @Version('1')
  @Get('provider/:providerId/history')
  getProviderPaymentHistory(@Param('providerId') providerId: string) {
    return this.paymentsService.getProviderPaymentHistory(providerId);
  }

  @Version('1')
  @Get('provider/:providerId/earnings-summary')
  getProviderEarningsSummary(@Param('providerId') providerId: string) {
    return this.paymentsService.getProviderEarningsSummary(providerId);
  }

  @Version('1')
  @Post('booking/ensure')
  ensureBookingPayment(@Body() body: { bookingId: string; customerId: string; providerId: string; amount: number; method?: string }) {
    return this.paymentsService.ensureBookingPayment(body);
  }

  @Version('1')
  @Patch('booking/mark-paid')
  markBookingPaymentPaid(@Body() body: { bookingId: string; amount?: number; customerId?: string; providerId?: string; method?: string }) {
    return this.paymentsService.markBookingPaymentPaid(body);
  }

  @Version('1')
  @Patch('booking/:bookingId/cancel')
  cancelBookingPayment(@Param('bookingId') bookingId: string) {
    return this.paymentsService.cancelBookingPayment(bookingId);
  }

  @Version('1')
  @Patch('booking/:bookingId/amount')
  updateBookingPaymentAmount(@Param('bookingId') bookingId: string, @Body() body: { amount: number }) {
    return this.paymentsService.updateBookingPaymentAmount(bookingId, body.amount);
  }
}

