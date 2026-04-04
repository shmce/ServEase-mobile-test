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

  @IsOptional()
  @IsNumber()
  @Min(1)
  hours_required?: number;
}
