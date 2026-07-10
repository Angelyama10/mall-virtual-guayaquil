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
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { UpdateOrderPaymentDto } from './dto/update-order-payment.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles(
    UserRole.CUSTOMER,
    UserRole.MERCHANT,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @Get()
  findMyOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.findMyOrders(user.id);
  }

  @Roles(UserRole.MERCHANT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('manage')
  findManageableOrders(@CurrentUser() user: AuthenticatedUser) {
    return this.ordersService.findManageableOrders(user);
  }

  @Roles(UserRole.MERCHANT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('manage/stores/:storeId')
  findManageableOrdersByStore(
    @CurrentUser() user: AuthenticatedUser,
    @Param('storeId') storeId: string,
  ) {
    return this.ordersService.findManageableOrders(user, storeId);
  }

  @Roles(UserRole.MERCHANT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('manage/:id')
  findManageableOrder(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.ordersService.findManageableOrder(user, id);
  }

  @Roles(UserRole.MERCHANT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id/status')
  updateOrderStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(user, id, dto);
  }

  @Roles(UserRole.MERCHANT, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id/payment')
  updateOrderPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrderPaymentDto,
  ) {
    return this.ordersService.updateOrderPayment(user, id, dto);
  }

  @Roles(
    UserRole.CUSTOMER,
    UserRole.MERCHANT,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @Get(':id')
  findMyOrder(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.ordersService.findMyOrder(user.id, id);
  }

  @Roles(
    UserRole.CUSTOMER,
    UserRole.MERCHANT,
    UserRole.ADMIN,
    UserRole.SUPER_ADMIN,
  )
  @Post('checkout')
  checkout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CheckoutOrderDto,
  ) {
    return this.ordersService.checkoutFromCart(user.id, dto);
  }
}
