import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Version,
  Patch,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerDashboardResponseDto } from './dto/customer-dashboard.dto';
import { UpdateCustomerProfileDto } from './dto/update-customer-profile.dto';
import { AppAuthGuard } from '../auth/guards/app-auth.guard';

@Controller('customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Version('1')
  @Get('dashboard/:id')
  async getDashboard(
    @Param('id', ParseUUIDPipe) customerId: string,
  ): Promise<CustomerDashboardResponseDto[]> {
    return this.customerService.getDashboardData(customerId);
  }

  @Version('1')
  @Patch('profile')
  @UseGuards(AppAuthGuard)
  async updateProfile(
    @Req() req: { authUser?: { sub?: string } },
    @Body() body: UpdateCustomerProfileDto,
  ) {
    return this.customerService.updateProfile(
      String(req.authUser?.sub ?? ''),
      body,
    );
  }

  @Version('1')
  @Get('profile')
  @UseGuards(AppAuthGuard)
  async getProfile(@Req() req: { authUser?: { sub?: string } }) {
    return this.customerService.getProfile(String(req.authUser?.sub ?? ''));
  }
}
