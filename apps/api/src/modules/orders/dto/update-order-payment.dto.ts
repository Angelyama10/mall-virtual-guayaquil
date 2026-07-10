import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class UpdateOrderPaymentDto {
  @IsEnum(PaymentStatus)
  status!: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsString()
  providerPaymentId?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  providerFee?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  refundAmount?: number;

  @IsOptional()
  @IsString()
  refundReason?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
