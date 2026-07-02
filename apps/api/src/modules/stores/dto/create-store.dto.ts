import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';

class CreateStoreAddressDto {
  @IsOptional()
  @IsString()
  countryId?: string;

  @IsString()
  street!: string;

  @IsString()
  city!: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}

class CreateStoreSettingsDto {
  @IsOptional()
  @IsString()
  whatsappNumber?: string;

  @IsOptional()
  @IsUrl()
  instagramUrl?: string;

  @IsOptional()
  @IsUrl()
  tiktokUrl?: string;

  @IsOptional()
  @IsUrl()
  websiteUrl?: string;

  @IsOptional()
  @IsBoolean()
  acceptsWhatsapp?: boolean;

  @IsOptional()
  @IsBoolean()
  acceptsCash?: boolean;

  @IsOptional()
  @IsBoolean()
  acceptsCard?: boolean;

  @IsOptional()
  @IsBoolean()
  acceptsOnlinePayment?: boolean;

  @IsOptional()
  @IsNumber()
  deliveryRadiusKm?: number;

  @IsOptional()
  @IsNumber()
  averagePreparationMinutes?: number;

  @IsOptional()
  @IsNumber()
  minimumOrderAmount?: number;

  @IsOptional()
  @IsNumber()
  freeDeliveryFromAmount?: number;
}

export class CreateStoreDto {
  @IsString()
  companyId!: string;

  @IsOptional()
  @IsString()
  countryId?: string;

  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsObject()
  openingHours?: Record<string, unknown>;

  @ValidateNested()
  @Type(() => CreateStoreAddressDto)
  address!: CreateStoreAddressDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateStoreSettingsDto)
  settings?: CreateStoreSettingsDto;
}
