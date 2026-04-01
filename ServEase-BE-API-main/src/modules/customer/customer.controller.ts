import { Controller, Get, Param, ParseUUIDPipe, Version } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CustomerDashboardResponseDto } from './dto/customer-dashboard.dto';

@Controller('customer')
export class CustomerController {
    constructor(private readonly customerService: CustomerService) {}

    @Version('1')
    @Get('dashboard/:id')
    async getDashboard(
        @Param('id', ParseUUIDPipe) customerId: string
    ): Promise<CustomerDashboardResponseDto[]> {
        return this.customerService.getDashboardData(customerId);
    }
}