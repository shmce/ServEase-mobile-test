import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Version,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { AppAuthGuard } from '../auth/guards/app-auth.guard';

@Controller('addresses')
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Version('1')
  @Get()
  @UseGuards(AppAuthGuard)
  getUserAddresses(@Req() req: { authUser: { sub: string } }) {
    return this.addressesService.getUserAddresses(req.authUser.sub);
  }

  @Version('1')
  @Post()
  @UseGuards(AppAuthGuard)
  addAddress(
    @Req() req: { authUser: { sub: string } },
    @Body() body: Record<string, any>,
  ) {
    return this.addressesService.addAddress(req.authUser.sub, body);
  }

  @Version('1')
  @Patch(':id')
  @UseGuards(AppAuthGuard)
  updateAddress(
    @Req() req: { authUser: { sub: string } },
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    return this.addressesService.updateAddress(req.authUser.sub, id, body);
  }

  @Version('1')
  @Delete(':id')
  @UseGuards(AppAuthGuard)
  deleteAddress(
    @Req() req: { authUser: { sub: string } },
    @Param('id') id: string,
  ) {
    return this.addressesService.deleteAddress(req.authUser.sub, id);
  }
}
