import { Controller, Get, Param, Query } from '@nestjs/common';
import { ProvidersService } from './providers.service';

@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Get()
  async getAllProviders() {
    return this.providersService.getAllProviders();
  }

  @Get('category/:category')
  async getProvidersByCategory(
    @Param('category') category: string,
  ) {
    return this.providersService.getProvidersByCategory(category);
  }

  @Get(':id')
  async getProviderById(@Param('id') id: string) {
    return this.providersService.getProviderById(id);
  }
}
