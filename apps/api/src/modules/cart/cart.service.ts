import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ProductStatus, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

const CART_SELECT = {
  id: true,
  userId: true,
  sessionId: true,
  createdAt: true,
  updatedAt: true,
  items: {
    orderBy: {
      addedAt: 'asc',
    },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          status: true,
          images: {
            where: {
              isPrimary: true,
            },
            take: 1,
          },
        },
      },
      variant: true,
    },
  },
} satisfies Prisma.CartSelect;

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyCart(userId: string) {
    return this.getOrCreateCart(userId);
  }

  async addItem(userId: string, dto: AddCartItemDto) {
    const product = await this.findPurchasableProductOrThrow(
      dto.productId,
      dto.variantId,
    );
    const variant = product.variants[0];

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    const inventory = await this.findInventoryOrThrow(
      product.storeId,
      variant.id,
    );
    this.ensureAvailableStock(inventory, dto.quantity);

    const cart = await this.getOrCreateCart(userId);
    this.ensureSingleStoreCart(cart.items, product.storeId);

    const existingItem = cart.items.find(
      (item) => item.productId === product.id && item.variantId === variant.id,
    );

    if (existingItem) {
      return this.updateItemQuantity(userId, existingItem.id, {
        quantity: existingItem.quantity + dto.quantity,
      });
    }

    await this.prisma.$transaction([
      this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          storeId: product.storeId,
          productId: product.id,
          variantId: variant.id,
          quantity: dto.quantity,
        },
      }),
      this.prisma.inventory.update({
        where: {
          storeId_variantId: {
            storeId: product.storeId,
            variantId: variant.id,
          },
        },
        data: {
          reservedStock: {
            increment: dto.quantity,
          },
        },
      }),
    ]);

    return this.getMyCart(userId);
  }

  async updateItemQuantity(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ) {
    const item = await this.findUserCartItemOrThrow(userId, itemId);
    const delta = dto.quantity - item.quantity;

    if (delta === 0) {
      return this.getMyCart(userId);
    }

    if (!item.variantId) {
      throw new NotFoundException('Product variant not found');
    }

    if (delta > 0) {
      const inventory = await this.findInventoryOrThrow(
        item.storeId,
        item.variantId,
      );
      this.ensureAvailableStock(inventory, delta);
    }

    await this.prisma.$transaction([
      this.prisma.cartItem.update({
        where: {
          id: item.id,
        },
        data: {
          quantity: dto.quantity,
        },
      }),
      this.prisma.inventory.update({
        where: {
          storeId_variantId: {
            storeId: item.storeId,
            variantId: item.variantId,
          },
        },
        data: {
          reservedStock: {
            increment: delta,
          },
        },
      }),
    ]);

    return this.getMyCart(userId);
  }

  async removeItem(userId: string, itemId: string) {
    const item = await this.findUserCartItemOrThrow(userId, itemId);

    if (!item.variantId) {
      throw new NotFoundException('Product variant not found');
    }

    await this.prisma.$transaction([
      this.prisma.cartItem.delete({
        where: {
          id: item.id,
        },
      }),
      this.prisma.inventory.update({
        where: {
          storeId_variantId: {
            storeId: item.storeId,
            variantId: item.variantId,
          },
        },
        data: {
          reservedStock: {
            increment: -item.quantity,
          },
        },
      }),
    ]);

    return this.getMyCart(userId);
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    if (cart.items.length === 0) {
      return cart;
    }

    await this.prisma.$transaction([
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
              reservedStock: {
                increment: -item.quantity,
              },
            },
          }),
        ),
      this.prisma.cartItem.deleteMany({
        where: {
          cartId: cart.id,
        },
      }),
    ]);

    return this.getMyCart(userId);
  }

  private async getOrCreateCart(userId: string) {
    const cart = await this.prisma.cart.findFirst({
      select: CART_SELECT,
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (cart) {
      return cart;
    }

    return this.prisma.cart.create({
      select: CART_SELECT,
      data: {
        userId,
      },
    });
  }

  private async findPurchasableProductOrThrow(
    productId: string,
    variantId?: string,
  ) {
    const product = await this.prisma.product.findFirst({
      where: {
        id: productId,
        status: ProductStatus.ACTIVE,
        isAvailable: true,
        deletedAt: null,
        store: {
          status: StoreStatus.ACTIVE,
          deletedAt: null,
          company: {
            isActive: true,
            deletedAt: null,
          },
        },
        category: {
          isActive: true,
          deletedAt: null,
        },
      },
      include: {
        variants: {
          where: {
            ...(variantId ? { id: variantId } : {}),
            isActive: true,
            isAvailable: true,
            deletedAt: null,
          },
          orderBy: {
            sortOrder: 'asc',
          },
          take: 1,
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  private async findInventoryOrThrow(storeId: string, variantId: string) {
    const inventory = await this.prisma.inventory.findUnique({
      where: {
        storeId_variantId: {
          storeId,
          variantId,
        },
      },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    return inventory;
  }

  private async findUserCartItemOrThrow(userId: string, itemId: string) {
    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: {
          userId,
        },
      },
    });

    if (!item) {
      throw new NotFoundException('Cart item not found');
    }

    return item;
  }

  private ensureSingleStoreCart(
    items: Array<{ storeId: string }>,
    nextStoreId: string,
  ) {
    const currentStoreId = items[0]?.storeId;

    if (currentStoreId && currentStoreId !== nextStoreId) {
      throw new BadRequestException(
        'Cart can only contain products from one store',
      );
    }
  }

  private ensureAvailableStock(
    inventory: { stock: number; reservedStock: number },
    requestedQuantity: number,
  ) {
    const availableStock = inventory.stock - inventory.reservedStock;

    if (availableStock < requestedQuantity) {
      throw new BadRequestException('Not enough stock available');
    }
  }
}
