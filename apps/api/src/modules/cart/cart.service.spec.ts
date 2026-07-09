import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CartService } from './cart.service';

describe('CartService', () => {
  let service: CartService;
  let prisma: {
    cart: {
      findFirst: jest.Mock;
      create: jest.Mock;
    };
    product: {
      findFirst: jest.Mock;
    };
    inventory: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    cartItem: {
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      deleteMany: jest.Mock;
      findFirst: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const emptyCart = {
    id: 'cart-1',
    userId: 'user-1',
    sessionId: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    items: [],
  };

  const cartWithItem = {
    ...emptyCart,
    items: [
      {
        id: 'item-1',
        cartId: 'cart-1',
        storeId: 'store-1',
        productId: 'product-1',
        variantId: 'variant-1',
        quantity: 2,
        addedAt: new Date('2026-01-01T00:00:00.000Z'),
        product: {
          id: 'product-1',
          name: 'Zapato deportivo',
          slug: 'zapato-deportivo',
          basePrice: 59.99,
          status: ProductStatus.ACTIVE,
          images: [],
        },
        variant: {
          id: 'variant-1',
          productId: 'product-1',
          name: 'Default',
          sku: 'ZAP-001',
          price: null,
          isActive: true,
          isAvailable: true,
          attributes: null,
          sortOrder: 0,
          deletedAt: null,
        },
      },
    ],
  };

  const product = {
    id: 'product-1',
    storeId: 'store-1',
    status: ProductStatus.ACTIVE,
    variants: [
      {
        id: 'variant-1',
        productId: 'product-1',
        name: 'Default',
      },
    ],
  };

  const inventory = {
    id: 'inventory-1',
    storeId: 'store-1',
    variantId: 'variant-1',
    stock: 10,
    reservedStock: 1,
  };

  beforeEach(async () => {
    prisma = {
      cart: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      product: {
        findFirst: jest.fn(),
      },
      inventory: {
        findUnique: jest.fn(),
        update: jest.fn().mockReturnValue('inventory-update'),
      },
      cartItem: {
        create: jest.fn().mockReturnValue('cart-item-create'),
        update: jest.fn().mockReturnValue('cart-item-update'),
        delete: jest.fn().mockReturnValue('cart-item-delete'),
        deleteMany: jest.fn().mockReturnValue('cart-items-delete-many'),
        findFirst: jest.fn(),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<CartService>(CartService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates an empty cart when the user has no cart', async () => {
    prisma.cart.findFirst.mockResolvedValue(null);
    prisma.cart.create.mockResolvedValue(emptyCart);

    await expect(service.getMyCart('user-1')).resolves.toEqual(emptyCart);
    expect(prisma.cart.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          userId: 'user-1',
        },
      }),
    );
  });

  it('adds an item and reserves inventory', async () => {
    prisma.product.findFirst.mockResolvedValue(product);
    prisma.inventory.findUnique.mockResolvedValue(inventory);
    prisma.cart.findFirst
      .mockResolvedValueOnce(emptyCart)
      .mockResolvedValueOnce(cartWithItem);

    const result = await service.addItem('user-1', {
      productId: 'product-1',
      quantity: 2,
    });

    expect(prisma.cartItem.create).toHaveBeenCalledWith({
      data: {
        cartId: 'cart-1',
        storeId: 'store-1',
        productId: 'product-1',
        variantId: 'variant-1',
        quantity: 2,
      },
    });
    expect(prisma.inventory.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          reservedStock: {
            increment: 2,
          },
        },
      }),
    );
    expect(prisma.$transaction).toHaveBeenCalledWith([
      'cart-item-create',
      'inventory-update',
    ]);
    expect(result).toEqual(cartWithItem);
  });

  it('blocks products from different stores in the same cart', async () => {
    prisma.product.findFirst.mockResolvedValue(product);
    prisma.inventory.findUnique.mockResolvedValue(inventory);
    prisma.cart.findFirst.mockResolvedValue({
      ...emptyCart,
      items: [
        {
          id: 'item-2',
          storeId: 'store-2',
          productId: 'other-product',
          variantId: 'variant-2',
          quantity: 1,
        },
      ],
    });

    await expect(
      service.addItem('user-1', {
        productId: 'product-1',
        quantity: 1,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('updates item quantity and adjusts the reserved stock delta', async () => {
    prisma.cartItem.findFirst.mockResolvedValue({
      id: 'item-1',
      storeId: 'store-1',
      productId: 'product-1',
      variantId: 'variant-1',
      quantity: 2,
    });
    prisma.inventory.findUnique.mockResolvedValue(inventory);
    prisma.cart.findFirst.mockResolvedValue(cartWithItem);

    await service.updateItemQuantity('user-1', 'item-1', {
      quantity: 5,
    });

    expect(prisma.cartItem.update).toHaveBeenCalledWith({
      where: {
        id: 'item-1',
      },
      data: {
        quantity: 5,
      },
    });
    expect(prisma.inventory.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          reservedStock: {
            increment: 3,
          },
        },
      }),
    );
  });

  it('removes an item and releases its reserved stock', async () => {
    prisma.cartItem.findFirst.mockResolvedValue({
      id: 'item-1',
      storeId: 'store-1',
      productId: 'product-1',
      variantId: 'variant-1',
      quantity: 2,
    });
    prisma.cart.findFirst.mockResolvedValue(emptyCart);

    await service.removeItem('user-1', 'item-1');

    expect(prisma.cartItem.delete).toHaveBeenCalledWith({
      where: {
        id: 'item-1',
      },
    });
    expect(prisma.inventory.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          reservedStock: {
            increment: -2,
          },
        },
      }),
    );
  });
});
