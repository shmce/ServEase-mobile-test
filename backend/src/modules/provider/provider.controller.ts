import {
  Controller,
  Query,
  Patch,
  Put,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  Version,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProviderService } from './provider.service';
import { UpdateProviderProfileDto } from './dto/update-provider-profile.dto';
import { AppAuthGuard } from '../auth/guards/app-auth.guard';

@Controller('provider')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  private getAuthUserId(req: { authUser?: { sub?: string } }) {
    return String(req.authUser?.sub || '').trim();
  }

  private assertSameUser(req: { authUser?: { sub?: string } }, userId: string) {
    if (this.getAuthUserId(req) !== userId) {
      throw new ForbiddenException(
        'You can only access your own provider data.',
      );
    }
  }

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
  reuploadKyc(
    @Body('provider_id') providerId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.providerService.reuploadKycDocument(providerId, file);
  }

  // ── Bookings ──────────────────────────────────────────────────────────────

  @Version('1')
  @UseGuards(AppAuthGuard)
  @Get('bookings')
  getOwnProviderBookings(@Req() req: any) {
    return this.providerService.getProviderBookings(this.getAuthUserId(req));
  }

  @Version('1')
  @UseGuards(AppAuthGuard)
  @Get(':id/bookings')
  getProviderBookings(@Param('id') id: string, @Req() req: any) {
    this.assertSameUser(req, id);
    return this.providerService.getProviderBookings(id);
  }

  @Version('1')
  @UseGuards(AppAuthGuard)
  @Get('booking/:bookingId')
  getProviderBookingById(
    @Param('bookingId') bookingId: string,
    @Req() req: any,
  ) {
    return this.providerService.getProviderBookingById(
      bookingId,
      this.getAuthUserId(req),
    );
  }

  @Version('1')
  @UseGuards(AppAuthGuard)
  @Patch('booking/:bookingId/status')
  updateProviderBookingStatus(
    @Req() req: any,
    @Param('bookingId') bookingId: string,
    @Body() body: { provider_id: string; status: string },
  ) {
    return this.providerService.updateProviderBookingStatus(
      bookingId,
      this.getAuthUserId(req),
      body.status,
    );
  }

  // ── Reschedule Requests ───────────────────────────────────────────────────

  @Version('1')
  @Post('reschedule-requests')
  createRescheduleRequest(
    @Body()
    body: {
      bookingId: string;
      providerId: string;
      reason: string;
      explanation: string;
      proposedDate: string;
      proposedTime: string;
    },
  ) {
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
    @Body()
    body: {
      bookingId: string;
      customerId: string;
      decision: 'approved' | 'declined';
    },
  ) {
    return this.providerService.reviewRescheduleRequest({ requestId, ...body });
  }

  // ── Additional Charges ────────────────────────────────────────────────────

  @Version('1')
  @Post('additional-charges')
  createAdditionalChargeRequest(
    @Body()
    body: {
      bookingId: string;
      providerId: string;
      justification: string;
      items: { description: string; amount: number }[];
    },
  ) {
    return this.providerService.createAdditionalChargeRequest(body);
  }

  @Version('1')
  @Get('additional-charges/:bookingId')
  getAdditionalChargeRequests(@Param('bookingId') bookingId: string) {
    return this.providerService.getAdditionalChargeRequests(bookingId);
  }

  @Version('1')
  @Patch('additional-charges/review')
  reviewAdditionalChargeRequest(
    @Body()
    body: {
      bookingId: string;
      customerId: string;
      chargeIds: string[];
      decision: 'approved' | 'declined';
    },
  ) {
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
  saveProviderProfileDraft(
    @Param('userId') userId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.providerService.saveProviderProfileDraft(userId, body);
  }

  @Version('1')
  @Patch('profile')
  @UseGuards(AppAuthGuard)
  updateProfile(@Req() req: any, @Body() body: UpdateProviderProfileDto) {
    return this.providerService.updateProfile(req.authUser.sub, body);
  }

  @Version('1')
  @Get('profile')
  @UseGuards(AppAuthGuard)
  getOwnProfile(@Req() req: any) {
    return this.providerService.getProviderProfile(req.authUser.sub);
  }

  @Version('1')
  @Get('my-services')
  @UseGuards(AppAuthGuard)
  getOwnServices(@Req() req: any) {
    return this.providerService.getProviderServices(req.authUser.sub);
  }

  @Version('1')
  @Post('my-services')
  @UseGuards(AppAuthGuard)
  createOwnService(@Req() req: any, @Body() body: Record<string, any>) {
    return this.providerService.saveProviderService(req.authUser.sub, body);
  }

  @Version('1')
  @Patch('my-services/:serviceId')
  @UseGuards(AppAuthGuard)
  updateOwnService(
    @Req() req: any,
    @Param('serviceId') serviceId: string,
    @Body() body: Record<string, any>,
  ) {
    return this.providerService.saveProviderService(
      req.authUser.sub,
      body,
      serviceId,
    );
  }

  @Version('1')
  @Delete('my-services/:serviceId')
  @UseGuards(AppAuthGuard)
  deleteOwnService(@Req() req: any, @Param('serviceId') serviceId: string) {
    return this.providerService.deleteProviderService(
      req.authUser.sub,
      serviceId,
    );
  }

  @Version('1')
  @Get('availability')
  @UseGuards(AppAuthGuard)
  getOwnAvailability(@Req() req: any) {
    return this.providerService.getProviderAvailability(req.authUser.sub);
  }

  @Version('1')
  @Get(':providerId/availability')
  getAvailability(@Param('providerId') providerId: string) {
    return this.providerService.getProviderAvailability(providerId);
  }

  @Version('1')
  @Put('availability')
  @UseGuards(AppAuthGuard)
  saveOwnAvailability(@Req() req: any, @Body() body: Record<string, any>) {
    return this.providerService.saveProviderAvailability(
      req.authUser.sub,
      body,
    );
  }

  @Version('1')
  @Post('reports')
  submitReport(
    @Body()
    body: {
      providerId: string;
      reporterId: string;
      bookingId?: string;
      reason: string;
      details?: string;
    },
  ) {
    return this.providerService.submitProviderReport(body);
  }

  @Version('1')
  @Post('reviews')
  submitReview(
    @Body()
    body: {
      booking_id: string;
      reviewer_id: string;
      reviewee_id: string;
      rating: number;
      review_text?: string;
    },
  ) {
    return this.providerService.submitReview(body);
  }

  // ── Generic profile (must be LAST to avoid shadowing specific routes) ─────

  @Version('1')
  @Get()
  getProviders(
    @Query('serviceId') serviceId: string,
    @Query('search') search: string,
  ) {
    return { providers: [] }; // kept for backward compat, use /services instead
  }

  @Version('1')
  @Get(':user_id')
  getProfile(@Param('user_id') userId: string) {
    return this.providerService.getProviderProfile(userId);
  }
}
