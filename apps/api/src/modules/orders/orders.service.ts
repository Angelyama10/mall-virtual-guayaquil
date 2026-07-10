import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CancellationReason,
  DeliveryType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  UserRole,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CheckoutOrderDto } from './dto/checkout-order.dto';
import { UpdateOrderPaymentDto } from './dto/update-order-payment.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

const ORDER_SELECT = {
  id: true,
  orderNumber: true,
  userId: true,
  storeId: true,
  addressId: true,
  deliveryType: true,
  subtotal: true,
  deliveryFee: true,
  discount: true,
  taxAmount: true,
  total: true,
  status: true,
  notes: true,
  cancellationReason: true,
  cancellationNote: true,
  estimatedDeliveryAt: true,
  confirmedAt: true,
  deliveredAt: true,
  createdAt: true,
  updatedAt: true,
  address: true,
  store: {
    select: {
      id: true,
      name: true,
      slug: true,
      settings: true,
    },
  },
  items: true,
  payment: true,
  statusHistory: {
    orderBy: {
      createdAt: 'asc',
    },
  },
} satisfies Prisma.OrderSelect;

type OrderResponse = Prisma.OrderGetPayload<{ select: typeof ORDER_SELECT }>;

const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [
    OrderStatus.SENT_TO_WHATSAPP,
    OrderStatus.CONFIRMED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.SENT_TO_WHATSAPP]: [
    OrderStatus.CONFIRMED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.CONFIRMED]: [
    OrderStatus.PROCESSING,
    OrderStatus.CANCELLED,
    OrderStatus.REFUNDED,
  ],
  [OrderStatus.PROCESSING]: [
    OrderStatus.READY_FOR_PICKUP,
    OrderStatus.ON_THE_WAY,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.READY_FOR_PICKUP]: [
    OrderStatus.ON_THE_WAY,
    OrderStatus.DELIVERED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.ON_THE_WAY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [OrderStatus.REFUNDED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REFUNDED]: [],
};

const PAYMENT_STATUS_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.PENDING]: [PaymentStatus.PAID, PaymentStatus.FAILED],
  [PaymentStatus.PAID]: [
    PaymentStatus.PARTIALLY_REFUNDED,
    PaymentStatus.REFUNDED,
  ],
  [PaymentStatus.FAILED]: [],
  [PaymentStatus.REFUNDED]: [],
  [PaymentStatus.PARTIALLY_REFUNDED]: [PaymentStatus.REFUNDED],
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  findMyOrders(userId: string) {
    return this.prisma.order.findMany({
      select: ORDER_SELECT,
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findMyOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      select: ORDER_SELECT,
      where: {
        id: orderId,
        userId,
        deletedAt: null,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.withWhatsappCheckoutUrl(order);
  }

  findManageableOrders(actor: AuthenticatedUser, storeId?: string) {
    this.ensureOrderManagerRole(actor);

    return this.prisma.order.findMany({
      select: ORDER_SELECT,
      where: {
        deletedAt: null,
        ...(storeId ? { storeId } : {}),
        ...this.buildManageableOrderWhere(actor),
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findManageableOrder(actor: AuthenticatedUser, orderId: string) {
    const order = await this.findManageableOrderOrThrow(actor, orderId);

    return this.withWhatsappCheckoutUrl(order);
  }

  async checkoutFromCart(userId: string, dto: CheckoutOrderDto) {
    const cart = await this.findCheckoutCartOrThrow(userId);
    await this.ensureAddressBelongsToUser(userId, dto.addressId);

    const storeId = this.getSingleStoreIdOrThrow(cart.items);
    const orderItems = cart.items.map((item) => {
      const unitPrice = Number(item.variant?.price ?? item.product.basePrice);
      const totalPrice = Number((unitPrice * item.quantity).toFixed(2));

      return {
        productId: item.productId,
        variantId: item.variantId,
        productName: item.product.name,
        variantName: item.variant?.name,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      };
    });
    const subtotal = Number(
      orderItems
        .reduce((sum, item) => sum + Number(item.totalPrice), 0)
        .toFixed(2),
    );
    const total = subtotal;
    const orderNumber = this.buildOrderNumber();

    const transaction = [
      this.prisma.order.create({
        select: ORDER_SELECT,
        data: {
          orderNumber,
          userId,
          storeId,
          addressId: dto.addressId,
          deliveryType: dto.deliveryType ?? DeliveryType.HOME_DELIVERY,
          subtotal,
          total,
          status: OrderStatus.SENT_TO_WHATSAPP,
          notes: dto.notes,
          items: {
            create: orderItems,
          },
          payment: {
            create: {
              amount: total,
              method: PaymentMethod.WHATSAPP_TRANSFER,
              status: PaymentStatus.PENDING,
            },
          },
          statusHistory: {
            create: {
              status: OrderStatus.SENT_TO_WHATSAPP,
              note: 'Checkout generated for WhatsApp confirmation',
            },
          },
        },
      }),
      ...cart.items
        .filter((item) => item.variantId)
        .map((item) =>
          this.prisma.inventory.update({
            where: {
              storeId_variantId: {
                storeId: item.storeId,
                variantId: item.variantId as string,
              },
            },
            data: {
              stock: {
                decrement: item.quantity,
              },
              reservedStock: {
                decrement: item.quantity,
              },
            },
          }),
        ),
      this.prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      }),
    ];

    const [order] = await this.prisma.$transaction(transaction);

    return this.withWhatsappCheckoutUrl(order as OrderResponse);
  }

  async updateOrderStatus(
    actor: AuthenticatedUser,
    orderId: string,
    dto: UpdateOrderStatusDto,
  ) {
    const order = await this.findManageableOrderOrThrow(actor, orderId);

    this.ensureOrderStatusTransition(order.status, dto.status);
    this.ensureCancellationHasReason(dto.status, dto.cancellationReason);

    if (order.status === dto.status) {
      return this.withWhatsappCheckoutUrl(order);
    }

    const now = new Date();
    const [updatedOrder] = await this.prisma.$transaction([
      this.prisma.order.update({
        select: ORDER_SELECT,
        where: { id: order.id },
        data: {
          status: dto.status,
          cancellationReason:
            dto.status === OrderStatus.CANCELLED
              ? dto.cancellationReason
              : undefined,
          cancellationNote:
            dto.status === OrderStatus.CANCELLED
              ? dto.cancellationNote
              : undefined,
          estimatedDeliveryAt: dto.estimatedDeliveryAt
            ? new Date(dto.estimatedDeliveryAt)
            : undefined,
          confirmedAt:
            dto.status === OrderStatus.CONFIRMED && !order.confirmedAt
              ? now
              : undefined,
          deliveredAt: dto.status === OrderStatus.DELIVERED ? now : undefined,
        },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: dto.status,
          note: dto.note,
          changedBy: actor.id,
        },
      }),
    ]);

    return this.withWhatsappCheckoutUrl(updatedOrder);
  }

  async updateOrderPayment(
    actor: AuthenticatedUser,
    orderId: string,
    dto: UpdateOrderPaymentDto,
  ) {
    const order = await this.findManageableOrderOrThrow(actor, orderId);

    if (!order.payment) {
      throw new NotFoundException('Payment not found');
    }

    this.ensurePaymentStatusTransition(order.payment.status, dto.status);
    this.ensureRefundHasAmount(dto.status, dto.refundAmount);

    if (order.payment.status === dto.status) {
      return this.withWhatsappCheckoutUrl(order);
    }

    const now = new Date();
    const refundAmount =
      dto.status === PaymentStatus.REFUNDED && dto.refundAmount === undefined
        ? Number(order.payment.amount)
        : dto.refundAmount;

    await this.prisma.payment.update({
      where: {
        orderId: order.id,
      },
      data: {
        status: dto.status,
        method: dto.method,
        providerPaymentId: dto.providerPaymentId,
        providerFee: dto.providerFee,
        refundAmount,
        refundReason: dto.refundReason,
        metadata: dto.metadata as Prisma.InputJsonValue,
        paidAt: dto.status === PaymentStatus.PAID ? now : undefined,
        refundedAt:
          dto.status === PaymentStatus.REFUNDED ||
          dto.status === PaymentStatus.PARTIALLY_REFUNDED
            ? now
            : undefined,
      },
    });

    return this.findManageableOrder(actor, order.id);
  }

  private async findCheckoutCartOrThrow(userId: string) {
    const cart = await this.prisma.cart.findFirst({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                store: {
                  include: {
                    settings: true,
                  },
                },
              },
            },
            variant: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    return cart;
  }

  private async ensureAddressBelongsToUser(userId: string, addressId?: string) {
    if (!addressId) {
      return;
    }

    const address = await this.prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
        deletedAt: null,
      },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }
  }

  private async findManageableOrderOrThrow(
    actor: AuthenticatedUser,
    orderId: string,
  ) {
    this.ensureOrderManagerRole(actor);

    const order = await this.prisma.order.findFirst({
      select: ORDER_SELECT,
      where: {
        id: orderId,
        deletedAt: null,
        ...this.buildManageableOrderWhere(actor),
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  private buildManageableOrderWhere(
    actor: AuthenticatedUser,
  ): Prisma.OrderWhereInput {
    if (actor.role === UserRole.ADMIN || actor.role === UserRole.SUPER_ADMIN) {
      return {};
    }

    if (actor.role !== UserRole.MERCHANT) {
      throw new ForbiddenException('Order management requires merchant access');
    }

    return {
      store: {
        company: {
          merchant: {
            is: {
              userId: actor.id,
              deletedAt: null,
            },
          },
        },
      },
    };
  }

  private ensureOrderManagerRole(actor: AuthenticatedUser) {
    if (
      actor.role === UserRole.MERCHANT ||
      actor.role === UserRole.ADMIN ||
      actor.role === UserRole.SUPER_ADMIN
    ) {
      return;
    }

    throw new ForbiddenException('Order management requires merchant access');
  }

  private ensureOrderStatusTransition(
    currentStatus: OrderStatus,
    nextStatus: OrderStatus,
  ) {
    if (currentStatus === nextStatus) {
      return;
    }

    if (!ORDER_STATUS_TRANSITIONS[currentStatus].includes(nextStatus)) {
      throw new BadRequestException(
        `Cannot move order from ${currentStatus} to ${nextStatus}`,
      );
    }
  }

  private ensureCancellationHasReason(
    nextStatus: OrderStatus,
    cancellationReason?: CancellationReason,
  ) {
    if (nextStatus === OrderStatus.CANCELLED && !cancellationReason) {
      throw new BadRequestException('Cancellation reason is required');
    }
  }

  private ensurePaymentStatusTransition(
    currentStatus: PaymentStatus,
    nextStatus: PaymentStatus,
  ) {
    if (currentStatus === nextStatus) {
      return;
    }

    if (!PAYMENT_STATUS_TRANSITIONS[currentStatus].includes(nextStatus)) {
      throw new BadRequestException(
        `Cannot move payment from ${currentStatus} to ${nextStatus}`,
      );
    }
  }

  private ensureRefundHasAmount(
    nextStatus: PaymentStatus,
    refundAmount?: number,
  ) {
    if (nextStatus === PaymentStatus.PARTIALLY_REFUNDED && !refundAmount) {
      throw new BadRequestException('Refund amount is required');
    }
  }

  private getSingleStoreIdOrThrow(items: Array<{ storeId: string }>) {
    const storeIds = new Set(items.map((item) => item.storeId));

    if (storeIds.size !== 1) {
      throw new BadRequestException(
        'Cart can only contain products from one store',
      );
    }

    const [storeId] = storeIds;

    return storeId;
  }

  private withWhatsappCheckoutUrl(order: OrderResponse) {
    const whatsappNumber = order.store?.settings?.whatsappNumber;

    return {
      ...order,
      whatsappCheckoutUrl: whatsappNumber
        ? this.buildWhatsappCheckoutUrl(whatsappNumber, order)
        : null,
    };
  }

  private buildWhatsappCheckoutUrl(
    whatsappNumber: string,
    order: { orderNumber: string; total: unknown },
  ) {
    const phone = whatsappNumber.replace(/\D/g, '');
    const total = Number(order.total).toFixed(2);
    const message = `Hola, quiero confirmar mi pedido ${order.orderNumber} por un total de $${total}.`;

    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  private buildOrderNumber() {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();

    return `MVG-${date}-${suffix}`;
  }
}
