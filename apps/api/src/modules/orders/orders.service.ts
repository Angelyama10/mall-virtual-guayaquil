import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DeliveryType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckoutOrderDto } from './dto/checkout-order.dto';

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
  createdAt: true,
  updatedAt: true,
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

  async checkoutFromCart(userId: string, dto: CheckoutOrderDto) {
    const cart = await this.findCheckoutCartOrThrow(userId);
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
