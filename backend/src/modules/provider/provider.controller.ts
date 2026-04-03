import { Controller, Query, Patch, Get, Post, Body, Param, UseInterceptors, UploadedFile, ParseUUIDPipe, Version } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProviderService } from './provider.service';

@Controller('provider')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Version('1')
  @Get('trust-score/:provider_id')
  getTrustScore(@Param('provider_id') providerId: string) {
    return this.providerService.getTrustScore(providerId);
  }

  @Version('1')
  @Get('reviews/:id')
  getProviderReviews(@Param('id', ParseUUIDPipe) id: string) {
    return this.providerService.getProviderReviews(id);
  }

  @Version('1')
  @Get('dashboard/:id')
  getDashboard(@Param('id', ParseUUIDPipe) id: string) {
    return this.providerService.getProviderDashboard(id);
  }

  @Version('1')
  @Patch('kyc/reupload')
  @UseInterceptors(FileInterceptor('document_file'))
  reuploadKyc(@Body('provider_id') providerId: string, @UploadedFile() file: Express.Multer.File) {
    return this.providerService.reuploadKycDocument(providerId, file);
  }

  // ── Bookings ──────────────────────────────────────────────────────────────

  @Version('1')
  @Get(':id/bookings')
  getProviderBookings(@Param('id') id: string) {
    return this.providerService.getProviderBookings(id);
  }

  @Version('1')
  @Get('booking/:bookingId')
  getProviderBookingById(@Param('bookingId') bookingId: string) {
    return this.providerService.getProviderBookingById(bookingId);
  }

  @Version('1')
  @Patch('booking/:bookingId/status')
  updateProviderBookingStatus(
    @Param('bookingId') bookingId: string,
    @Body() body: { provider_id: string; status: string },
  ) {
    return this.providerService.updateProviderBookingStatus(bookingId, body.provider_id, body.status);
  }

  // ── Reschedule Requests ───────────────────────────────────────────────────

  @Version('1')
  @Post('reschedule-requests')
  createRescheduleRequest(@Body() body: { bookingId: string; providerId: string; reason: string; explanation: string; proposedDate: string; proposedTime: string }) {
    return this.providerService.createRescheduleRequest(body);
  }

  @Version('1')
  @Get('reschedule-requests/:bookingId')
  getRescheduleRequests(@Param('bookingId') bookingId: string) {
    return this.providerService.getRescheduleRequests(bookingId);
  }

  @Version('1')
  @Patch('reschedule-requests/:requestId/review')
  reviewRescheduleRequest(
    @Param('requestId') requestId: string,
    @Body() body: { bookingId: string; customerId: string; decision: 'approved' | 'declined' },
  ) {
    return this.providerService.reviewRescheduleRequest({ requestId, ...body });
  }

  // ── Additional Charges ────────────────────────────────────────────────────

  @Version('1')
  @Post('additional-charges')
  createAdditionalChargeRequest(@Body() body: { bookingId: string; providerId: string; justification: string; items: { description: string; amount: number }[] }) {
    return this.providerService.createAdditionalChargeRequest(body);
  }

  @Version('1')
  @Get('additional-charges/:bookingId')
  getAdditionalChargeRequests(@Param('bookingId') bookingId: string) {
    return this.providerService.getAdditionalChargeRequests(bookingId);
  }

  @Version('1')
  @Patch('additional-charges/review')
  reviewAdditionalChargeRequest(@Body() body: { bookingId: string; customerId: string; chargeIds: string[]; decision: 'approved' | 'declined' }) {
    return this.providerService.reviewAdditionalChargeRequest(body);
  }

  // ── Profile Draft ─────────────────────────────────────────────────────────

  @Version('1')
  @Get(':userId/profile-draft')
  getProviderProfileDraft(@Param('userId') userId: string) {
    return this.providerService.getProviderProfileDraft(userId);
  }

  @Version('1')
  @Patch(':userId/profile-draft')
  saveProviderProfileDraft(@Param('userId') userId: string, @Body() body: Record<string, any>) {
    return this.providerService.saveProviderProfileDraft(userId, body);
  }

  @Version('1')
  @Post('reviews')
  submitReview(
    @Body() body: {
      booking_id: string;
      reviewer_id: string;
      reviewee_id: string;
      rating: number;
      review_text?: string;
    }
  ) {
    return this.providerService.submitReview(body);
  }

  // ── Generic profile (must be LAST to avoid shadowing specific routes) ─────

  @Version('1')
  @Get()
  getProviders(@Query('serviceId') serviceId: string, @Query('search') search: string) {
    return search ? { providers: [] } : { providers: [] }; // kept for backward compat, use /services instead
  }

  @Version('1')
  @Get(':user_id')
  getProfile(@Param('user_id') userId: string) {
    return this.providerService.getProviderProfile(userId);
  }
}
