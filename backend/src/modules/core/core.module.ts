import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { HealthController } from '../health/health.controller';
import { DatabaseService } from '../database/database.service';

@Module({
  imports: [DatabaseModule],
  controllers: [HealthController],
  providers: [DatabaseService],
  exports: [DatabaseModule],
})
export class CoreModule {}
