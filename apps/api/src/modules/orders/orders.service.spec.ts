import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  DeliveryType,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  let service: OrdersService;
  let prisma: {
    order: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
    };
    cart: {
      findFirst: jest.Mock;
    };
    inventory: {
      update: jest.Mock;
    };
    cartItem: {
      deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const cart = {
    id: 'cart-1',
    userId: 'user-1',
    items: [
      {
        id: 'item-1',
        cartId: 'cart-1',
        storeId: 'store-1',
        productId: 'product-1',
        variantId: 'variant-1',
        quantity: 2,
        product: {
          id: 'product-1',
          name: 'Zapato deportivo',
          basePrice: 50,
          store: {
            settings: {
              whatsappNumber: '+593999999999',
            },
          },
        },
        variant: {
          id: 'variant-1',
          name: 'Talla M',
          price: 55,
        },
      },
    ],
  };

  const order = {
    id: 'order-1',
    orderNumber: 'MVG-20260702-ABC123',
    userId: 'user-1',
    storeId: 'store-1',
    total: 110,
    status: OrderStatus.SENT_TO_WHATSAPP,
    store: {
      settings: {
        whatsappNumber: '+593999999999',
      },
    },
    items: [],
    payment: {
      method: PaymentMethod.WHATSAPP_TRANSFER,
      status: PaymentStatus.PENDING,
    },
    statusHistory: [],
  };

  beforeEach(async () => {
    prisma = {
      order: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn().mockReturnValue('order-create'),
      },
      cart: {
        findFirst: jest.fn(),
      },
      inventory: {
        update: jest.fn().mockReturnValue('inventory-update'),
      },
      cartItem: {
        deleteMany: jest.fn().mockReturnValue('cart-items-delete-many'),
      },
      $transaction: jest.fn().mockResolvedValue([order]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a WhatsApp checkout order from the current cart', async () => {
    prisma.cart.findFirst.mockResolvedValue(cart);

    const result = await service.checkoutFromCart('user-1', {
      deliveryType: DeliveryType.HOME_DELIVERY,
      notes: 'Entregar en recepcion',
    });

    expect(prisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          storeId: 'store-1',
          deliveryType: DeliveryType.HOME_DELIVERY,
          subtotal: 110,
          total: 110,
          status: OrderStatus.SENT_TO_WHATSAPP,
          notes: 'Entregar en recepcion',
          items: {
            create: [
              {
                productId: 'product-1',
                variantId: 'variant-1',
                productName: 'Zapato deportivo',
                variantName: 'Talla M',
                quantity: 2,
                unitPrice: 55,
                totalPrice: 110,
              },
            ],
          },
          payment: {
            create: {
              amount: 110,
              method: PaymentMethod.WHATSAPP_TRANSFER,
              status: PaymentStatus.PENDING,
            },
          },
        }),
      }),
    );
    expect(prisma.inventory.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          stock: {
            decrement: 2,
          },
          reservedStock: {
            decrement: 2,
          },
        },
      }),
    );
    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
      where: {
        cartId: 'cart-1',
      },
    });
    expect(result.whatsappCheckoutUrl).toContain('https://wa.me/593999999999');
  });

  it('rejects checkout when the cart is empty', async () => {
    prisma.cart.findFirst.mockResolvedValue({
      ...cart,
      items: [],
    });

    await expect(service.checkoutFromCart('user-1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects checkout when cart items belong to different stores', async () => {
    prisma.cart.findFirst.mockResolvedValue({
      ...cart,
      items: [
        cart.items[0],
        {
          ...cart.items[0],
          id: 'item-2',
          storeId: 'store-2',
        },
      ],
    });

    await expect(service.checkoutFromCart('user-1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('finds an order owned by the current user', async () => {
    prisma.order.findFirst.mockResolvedValue(order);

    const result = await service.findMyOrder('user-1', 'order-1');

    expect(prisma.order.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'order-1',
          userId: 'user-1',
          deletedAt: null,
        },
      }),
    );
    expect(result.whatsappCheckoutUrl).toContain('MVG-20260702-ABC123');
  });

  it('throws when the order does not belong to the current user', async () => {
    prisma.order.findFirst.mockResolvedValue(null);

    await expect(
      service.findMyOrder('user-1', 'missing-order'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
