import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CoreModule } from './modules/core/core.module';
import { ProvidersModule } from './modules/providers/providers.module';
// Import additional modules as they're created:
// import { AuthModule } from './modules/auth/auth.module';
// import { BookingsModule } from './modules/bookings/bookings.module';
// import { ServicesModule } from './modules/services/services.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    CoreModule,
    ProvidersModule,
    // AuthModule,
    // BookingsModule,
    // ServicesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
