import { Controller, Get, Param, Version } from '@nestjs/common';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Version('1')
  @Get('provinces')
  getProvinces() {
    return this.locationsService.getProvinces();
  }

  @Version('1')
  @Get('provinces/:provinceCode/cities')
  getCities(@Param('provinceCode') provinceCode: string) {
    return this.locationsService.getCities(provinceCode);
  }

  @Version('1')
  @Get('cities/:cityCode/barangays')
  getBarangays(@Param('cityCode') cityCode: string) {
    return this.locationsService.getBarangays(cityCode);
  }
}
