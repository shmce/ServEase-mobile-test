import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsIn,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateBookingDto {
  @IsString()
  @IsNotEmpty()
  provider_id: string;

  @IsString()
  @IsNotEmpty()
  service_id: string;

  @IsString()
  @IsNotEmpty()
  service_address: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['mobile', 'in_shop'])
  service_location_type: 'mobile' | 'in_shop';

  @IsDateString()
  @IsNotEmpty()
  scheduled_at: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['hourly', 'flat'])
  pricing_mode: 'hourly' | 'flat';

  @IsOptional()
  @IsNumber()
  @Min(0)
  hourly_rate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  flat_rate?: number;

  @IsNumber()
  @Min(1)
  hours_required: number;

  @IsString()
  @IsOptional()
  @IsIn(['cash', 'cash_on_service', 'card', 'wallet', 'gcash', 'paymaya'])
  payment_method?: string;
}
