import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(
    UserRole.CUSTOMER,
    UserRole.MERCHANT,
    UserRole.DRIVER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @Get('me/addresses')
  findMyAddresses(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findMyAddresses(user.id);
  }

  @Roles(
    UserRole.CUSTOMER,
    UserRole.MERCHANT,
    UserRole.DRIVER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @Post('me/addresses')
  createMyAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAddressDto,
  ) {
    return this.usersService.createMyAddress(user.id, dto);
  }

  @Roles(
    UserRole.CUSTOMER,
    UserRole.MERCHANT,
    UserRole.DRIVER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @Get('me/addresses/:addressId')
  findMyAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('addressId') addressId: string,
  ) {
    return this.usersService.findMyAddress(user.id, addressId);
  }

  @Roles(
    UserRole.CUSTOMER,
    UserRole.MERCHANT,
    UserRole.DRIVER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @Patch('me/addresses/:addressId')
  updateMyAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('addressId') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.usersService.updateMyAddress(user.id, addressId, dto);
  }

  @Roles(
    UserRole.CUSTOMER,
    UserRole.MERCHANT,
    UserRole.DRIVER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @Patch('me/addresses/:addressId/default')
  setDefaultAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('addressId') addressId: string,
  ) {
    return this.usersService.setDefaultAddress(user.id, addressId);
  }

  @Roles(
    UserRole.CUSTOMER,
    UserRole.MERCHANT,
    UserRole.DRIVER,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @Delete('me/addresses/:addressId')
  removeMyAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param('addressId') addressId: string,
  ) {
    return this.usersService.removeMyAddress(user.id, addressId);
  }

  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
