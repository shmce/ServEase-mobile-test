import { Controller, Get, Query, Param, Version } from '@nestjs/common';
import { ServicesService } from './services.service';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Version('1')
  @Get('categories')
  getServiceCategories() {
    return this.servicesService.getServiceCategories();
  }

  @Version('1')
  @Get('categories/:name/services')
  getServicesByCategoryName(@Param('name') name: string) {
    return this.servicesService.getServicesByCategoryName(name);
  }

  @Version('1')
  @Get('providers/:serviceName')
  getProvidersByServiceName(@Param('serviceName') serviceName: string) {
    return this.servicesService.getProvidersByServiceName(serviceName);
  }

  @Version('1')
  @Get('provider-profile/:providerId')
  getProviderProfileData(@Param('providerId') providerId: string) {
    return this.servicesService.getProviderProfileData(providerId);
  }

  @Version('2')
  @Get('search')
  async search(@Query('keyword') keyword: string) {
    return this.servicesService.searchServices(keyword);
  }
}

