import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingListeners } from './listeners/booking.listeners';

@Module({
  controllers: [BookingController],
  providers: [BookingService, BookingListeners],
})
export class BookingModule {}
