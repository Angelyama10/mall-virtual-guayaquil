import { UserRole } from '@prisma/client';
import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(8)
  plainPassword!: string;

  @IsOptional()
  @IsIn([UserRole.CUSTOMER, UserRole.MERCHANT])
  role?: UserRole;
}
