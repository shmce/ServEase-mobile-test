import {
  IsString,
  IsOptional,
  MaxLength,
  IsArray,
  IsNumber,
} from 'class-validator';

export class UpdateProviderProfileDto {
  @IsOptional()
  @IsString()
  business_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  service_areas?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @IsOptional()
  @IsNumber()
  years_experience?: number;

  @IsOptional()
  @IsString()
  facebook_url?: string;

  @IsOptional()
  @IsString()
  instagram_handle?: string;

  @IsOptional()
  @IsString()
  website_url?: string;
}
