import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { CancellationReason, OrderStatus } from '@prisma/client';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(CancellationReason)
  cancellationReason?: CancellationReason;

  @IsOptional()
  @IsString()
  cancellationNote?: string;

  @IsOptional()
  @IsDateString()
  estimatedDeliveryAt?: string;
}
