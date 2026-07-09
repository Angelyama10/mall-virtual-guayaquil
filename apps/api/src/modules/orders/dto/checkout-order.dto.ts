import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DeliveryType } from '@prisma/client';

export class CheckoutOrderDto {
  @IsOptional()
  @IsString()
  addressId?: string;

  @IsOptional()
  @IsEnum(DeliveryType)
  deliveryType?: DeliveryType;

  @IsOptional()
  @IsString()
  notes?: string;
}
