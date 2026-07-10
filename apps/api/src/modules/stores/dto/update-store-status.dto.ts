import { StoreStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateStoreStatusDto {
  @IsEnum(StoreStatus)
  status!: StoreStatus;

  @IsOptional()
  @IsString()
  note?: string;
}
