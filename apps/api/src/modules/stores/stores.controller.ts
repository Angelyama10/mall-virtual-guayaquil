import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CreateMerchantCompanyDto } from './dto/create-merchant-company.dto';
import { CreateMerchantProfileDto } from './dto/create-merchant-profile.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreStatusDto } from './dto/update-store-status.dto';
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('admin')
  findAllForAdmin() {
    return this.storesService.findAllForAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('admin/pending')
  findPendingStoresForAdmin() {
    return this.storesService.findPendingStoresForAdmin();
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id/status')
  updateStoreStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateStoreStatusDto,
  ) {
    return this.storesService.updateStoreStatus(user, id, dto);
  }
}
