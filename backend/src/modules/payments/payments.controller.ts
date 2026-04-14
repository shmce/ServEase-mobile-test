import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Version,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AppAuthGuard } from '../auth/guards/app-auth.guard';

@UseGuards(AppAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  private getAuthUserId(req: Request & { authUser?: { sub?: string } }) {
    return String(req.authUser?.sub || '').trim();
  }

  private assertSameUser(
    req: Request & { authUser?: { sub?: string } },
    userId: string,
  ) {
    if (this.getAuthUserId(req) !== userId) {
      throw new ForbiddenException(
        'You can only access your own payment data.',
      );
    }
  }

  @Version('1')
  @Post('create')
  createPayment(@Body() dto: CreatePaymentDto, @Req() req: Request) {
    this.assertSameUser(
      req as Request & { authUser?: { sub?: string } },
      dto.customer_id,
    );
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
  getProviderPaymentHistory(
    @Param('providerId') providerId: string,
    @Req() req: Request,
  ) {
    this.assertSameUser(
      req as Request & { authUser?: { sub?: string } },
      providerId,
    );
    return this.paymentsService.getProviderPaymentHistory(providerId);
  }

  @Version('1')
  @Get('provider/history')
  getOwnProviderPaymentHistory(@Req() req: Request) {
    const providerId = this.getAuthUserId(
      req as Request & { authUser?: { sub?: string } },
    );
    return this.paymentsService.getProviderPaymentHistory(providerId);
  }

  @Version('1')
  @Get('provider/:providerId/earnings-summary')
  getProviderEarningsSummary(
    @Param('providerId') providerId: string,
    @Req() req: Request,
  ) {
    this.assertSameUser(
      req as Request & { authUser?: { sub?: string } },
      providerId,
    );
    return this.paymentsService.getProviderEarningsSummary(providerId);
  }

  @Version('1')
  @Get('provider/earnings-summary')
  getOwnProviderEarningsSummary(@Req() req: Request) {
    const providerId = this.getAuthUserId(
      req as Request & { authUser?: { sub?: string } },
    );
    return this.paymentsService.getProviderEarningsSummary(providerId);
  }

  @Version('1')
  @Post('booking/ensure')
  ensureBookingPayment(
    @Body()
    body: {
      bookingId: string;
      customerId: string;
      providerId: string;
      amount: number;
      method?: string;
    },
    @Req() req: Request,
  ) {
    this.assertSameUser(
      req as Request & { authUser?: { sub?: string } },
      body.customerId,
    );
    return this.paymentsService.ensureBookingPayment(body);
  }

  @Version('1')
  @Patch('booking/mark-paid')
  markBookingPaymentPaid(
    @Body()
    body: {
      bookingId: string;
      amount?: number;
      customerId?: string;
      providerId?: string;
      method?: string;
    },
    @Req() req: Request,
  ) {
    // Providers can mark as paid, OR the specific customer if they are self-reporting
    // For now, we prioritize provider authorization for "Paid" status in cash transactions
    if (body.providerId) {
      this.assertSameUser(
        req as Request & { authUser?: { sub?: string } },
        body.providerId,
      );
    }
    return this.paymentsService.markBookingPaymentPaid(body);
  }

  @Version('1')
  @Patch('booking/:bookingId/cancel')
  async cancelBookingPayment(
    @Param('bookingId') bookingId: string,
    @Req() req: Request,
  ) {
    const payment = await this.paymentsService.getPaymentByBookingId(bookingId);
    if (payment.payment) {
      this.assertSameUser(
        req as Request & { authUser?: { sub?: string } },
        payment.payment.customer_id,
      );
    }
    return this.paymentsService.cancelBookingPayment(bookingId);
  }

  @Version('1')
  @Patch('booking/:bookingId/amount')
  updateBookingPaymentAmount(
    @Param('bookingId') bookingId: string,
    @Body() body: { amount: number },
  ) {
    return this.paymentsService.updateBookingPaymentAmount(
      bookingId,
      body.amount,
    );
  }
}
