import {
  Controller,
  Post,
  Param,
  Body,
  Req,
  UploadedFile,
  UseInterceptors,
  Version,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AppAuthGuard } from '../auth/guards/app-auth.guard';
import { UploadsService } from './uploads.service';
import type { Request } from 'express';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  private getAuthUserId(req: Request & { authUser?: { sub?: string } }) {
    const userId = String(req.authUser?.sub || '').trim();
    if (!userId) throw new UnauthorizedException('Invalid or expired token.');
    return userId;
  }

  @Version('1')
  @UseGuards(AppAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @Post('avatar')
  uploadAvatar(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    const userId = this.getAuthUserId(req as any);
    return this.uploadsService.uploadAvatar(userId, file);
  }

  @Version('1')
  @UseGuards(AppAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @Post('booking/:bookingId/attachment')
  uploadBookingAttachment(
    @Param('bookingId') bookingId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('label') label: string | undefined,
    @Req() req: Request,
  ) {
    const userId = this.getAuthUserId(req as any);
    return this.uploadsService.uploadBookingAttachment(
      bookingId,
      userId,
      file,
      label,
    );
  }

  @Version('1')
  @UseGuards(AppAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  @Post('verification/document')
  uploadVerificationDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('document_type') documentType: string,
    @Req() req: Request,
  ) {
    const userId = this.getAuthUserId(req as any);
    return this.uploadsService.uploadVerificationDocument(
      userId,
      file,
      documentType,
    );
  }
}
