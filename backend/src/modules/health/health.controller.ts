import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Controller('health')
export class HealthController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  async checkHealth() {
    try {
      const isHealthy = await this.db.healthCheck();

      if (!isHealthy) {
        throw new HttpException(
          'Database connection failed',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      return {
        status: 'ok',
        service: 'ServEase API',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        'Health check failed: ' + (error as Error).message,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
