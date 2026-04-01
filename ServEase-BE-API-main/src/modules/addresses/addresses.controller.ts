import { Controller, Get, Post, Patch, Delete, Param, Body, Version } from '@nestjs/common';
import { AddressesService } from './addresses.service';

@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Version('1')
  @Get(':userId')
  getUserAddresses(@Param('userId') userId: string) {
    return this.addressesService.getUserAddresses(userId);
  }

  @Version('1')
  @Post()
  addAddress(@Body() body: Record<string, any>) {
    return this.addressesService.addAddress(body);
  }

  @Version('1')
  @Patch(':id')
  updateAddress(@Param('id') id: string, @Body() body: Record<string, any>) {
    return this.addressesService.updateAddress(id, body);
  }

  @Version('1')
  @Delete(':id')
  deleteAddress(@Param('id') id: string) {
    return this.addressesService.deleteAddress(id);
  }
}

