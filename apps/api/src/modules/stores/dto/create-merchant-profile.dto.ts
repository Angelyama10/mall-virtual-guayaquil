import { IsEmail, IsOptional, IsString } from 'class-validator';

export class CreateMerchantProfileDto {
  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  taxIdCountry?: string;

  @IsEmail()
  contactEmail!: string;

  @IsString()
  contactPhone!: string;
}
