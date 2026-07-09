import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProductStatus, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';

const PRODUCT_SELECT = {
  id: true,
  storeId: true,
  categoryId: true,
  name: true,
  slug: true,
  description: true,
  basePrice: true,
  compareAtPrice: true,
  sku: true,
  barcode: true,
  weightGrams: true,
  status: true,
  isFeatured: true,
  isAvailable: true,
  availableFrom: true,
  availableTo: true,
  availableDays: true,
  averageRating: true,
  reviewCount: true,
  totalSold: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  store: {
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
    },
  },
  category: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  images: {
    orderBy: {
      sortOrder: 'asc',
    },
  },
  variants: {
    where: {
      deletedAt: null,
    },
    orderBy: {
      sortOrder: 'asc',
    },
    include: {
      inventory: true,
    },
  },
} satisfies Prisma.ProductSelect;

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProduct(userId: string, dto: CreateProductDto) {
    await this.findOwnedStoreOrThrow(userId, dto.storeId);
    await this.findCategoryOrThrow(dto.categoryId);

    const slug = await this.buildUniqueProductSlug(dto.slug ?? dto.name);
    const variants = dto.variants?.length
      ? dto.variants
      : [
          {
            name: 'Default',
            sku: dto.sku,
            stock: dto.initialStock ?? 0,
          },
        ];

    return this.prisma.product.create({
      select: PRODUCT_SELECT,
      data: {
        storeId: dto.storeId,
        categoryId: dto.categoryId,
        name: dto.name,
        slug,
        description: dto.description,
        basePrice: dto.basePrice,
        compareAtPrice: dto.compareAtPrice,
        sku: dto.sku,
        barcode: dto.barcode,
        weightGrams: dto.weightGrams,
        status: dto.status ?? ProductStatus.DRAFT,
        isFeatured: dto.isFeatured,
        isAvailable: dto.isAvailable,
        availableFrom: dto.availableFrom,
        availableTo: dto.availableTo,
        availableDays: dto.availableDays as Prisma.InputJsonValue,
        images: dto.images?.length
          ? {
              create: dto.images.map((image, index) => ({
                url: image.url,
                altText: image.altText,
                sortOrder: image.sortOrder ?? index,
                isPrimary: image.isPrimary ?? index === 0,
              })),
            }
          : undefined,
        variants: {
          create: variants.map((variant, index) => ({
            name: variant.name,
            sku: variant.sku,
            price: variant.price,
            attributes: variant.attributes as Prisma.InputJsonValue,
            sortOrder: index,
            inventory: {
              create: {
                storeId: dto.storeId,
                stock: variant.stock ?? 0,
                lowStockAlert: variant.lowStockAlert,
              },
            },
          })),
        },
      },
    });
  }

  findPublicProducts() {
    return this.prisma.product.findMany({
      select: PRODUCT_SELECT,
      where: {
        status: ProductStatus.ACTIVE,
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findPublicProductBySlug(slug: string) {
    const product = await this.prisma.product.findFirst({
      select: PRODUCT_SELECT,
      where: {
        slug,
        status: ProductStatus.ACTIVE,
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
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  findMyProducts(userId: string) {
    return this.prisma.product.findMany({
      select: PRODUCT_SELECT,
      where: {
        deletedAt: null,
        store: {
          deletedAt: null,
          company: {
            deletedAt: null,
            merchant: {
              is: {
                userId,
                deletedAt: null,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private async findOwnedStoreOrThrow(userId: string, storeId: string) {
    const store = await this.prisma.store.findFirst({
      where: {
        id: storeId,
        deletedAt: null,
        company: {
          deletedAt: null,
          merchant: {
            is: {
              userId,
              deletedAt: null,
            },
          },
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }

  private async findCategoryOrThrow(categoryId: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id: categoryId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  private async buildUniqueProductSlug(value: string) {
    const baseSlug = this.slugify(value);
    let candidate = baseSlug;
    let suffix = 2;

    while (
      await this.prisma.product.findUnique({
        where: {
          slug: candidate,
        },
      })
    ) {
      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    return candidate;
  }

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
