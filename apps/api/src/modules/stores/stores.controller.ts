import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CreateMerchantCompanyDto } from './dto/create-merchant-company.dto';
import { CreateMerchantProfileDto } from './dto/create-merchant-profile.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { StoresService } from './stores.service';

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  findPublicStores() {
    return this.storesService.findPublicStores();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Get('my')
  findMyStores(@CurrentUser() user: AuthenticatedUser) {
    return this.storesService.findMyStores(user.id);
  }

  @Get(':slug')
  findPublicStoreBySlug(@Param('slug') slug: string) {
    return this.storesService.findPublicStoreBySlug(slug);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Post('merchant-profile')
  createMerchantProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMerchantProfileDto,
  ) {
    return this.storesService.createMerchantProfile(user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Post('companies')
  createCompany(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateMerchantCompanyDto,
  ) {
    return this.storesService.createCompany(user.id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.MERCHANT)
  @Post()
  createStore(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateStoreDto,
  ) {
    return this.storesService.createStore(user.id, dto);
  }
}
