import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: {
    store: {
      findFirst: jest.Mock;
    };
    category: {
      findFirst: jest.Mock;
    };
    product: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  const product = {
    id: 'product-1',
    storeId: 'store-1',
    categoryId: 'category-1',
    name: 'Zapato deportivo',
    slug: 'zapato-deportivo',
    basePrice: 59.99,
    status: ProductStatus.DRAFT,
  };

  beforeEach(async () => {
    prisma = {
      store: {
        findFirst: jest.fn(),
      },
      category: {
        findFirst: jest.fn(),
      },
      product: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a product with a default variant and inventory', async () => {
    prisma.store.findFirst.mockResolvedValue({ id: 'store-1' });
    prisma.category.findFirst.mockResolvedValue({ id: 'category-1' });
    prisma.product.findUnique.mockResolvedValue(null);
    prisma.product.create.mockResolvedValue(product);

    const result = await service.createProduct('user-1', {
      storeId: 'store-1',
      categoryId: 'category-1',
      name: 'Zapato deportivo',
      basePrice: 59.99,
      sku: 'ZAP-001',
      initialStock: 7,
      images: [
        {
          url: 'https://example.com/zapato.jpg',
        },
      ],
    });

    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          storeId: 'store-1',
          categoryId: 'category-1',
          name: 'Zapato deportivo',
          slug: 'zapato-deportivo',
          sku: 'ZAP-001',
          status: ProductStatus.DRAFT,
          variants: {
            create: [
              expect.objectContaining({
                name: 'Default',
                sku: 'ZAP-001',
                inventory: {
                  create: {
                    storeId: 'store-1',
                    stock: 7,
                    lowStockAlert: undefined,
                  },
                },
              }),
            ],
          },
        }),
      }),
    );
    expect(result).toEqual(product);
  });

  it('creates a product with explicit variants', async () => {
    prisma.store.findFirst.mockResolvedValue({ id: 'store-1' });
    prisma.category.findFirst.mockResolvedValue({ id: 'category-1' });
    prisma.product.findUnique.mockResolvedValue(null);
    prisma.product.create.mockResolvedValue(product);

    await service.createProduct('user-1', {
      storeId: 'store-1',
      categoryId: 'category-1',
      name: 'Camiseta',
      basePrice: 25,
      variants: [
        {
          name: 'Talla M / Rojo',
          sku: 'CAM-M-ROJO',
          stock: 3,
          attributes: {
            talla: 'M',
            color: 'rojo',
          },
        },
      ],
    });

    expect(prisma.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          variants: {
            create: [
              expect.objectContaining({
                name: 'Talla M / Rojo',
                sku: 'CAM-M-ROJO',
                attributes: {
                  talla: 'M',
                  color: 'rojo',
                },
                inventory: {
                  create: {
                    storeId: 'store-1',
                    stock: 3,
                    lowStockAlert: undefined,
                  },
                },
              }),
            ],
          },
        }),
      }),
    );
  });

  it('requires an owned store before creating a product', async () => {
    prisma.store.findFirst.mockResolvedValue(null);

    await expect(
      service.createProduct('user-1', {
        storeId: 'store-1',
        categoryId: 'category-1',
        name: 'Zapato deportivo',
        basePrice: 59.99,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('requires an active category before creating a product', async () => {
    prisma.store.findFirst.mockResolvedValue({ id: 'store-1' });
    prisma.category.findFirst.mockResolvedValue(null);

    await expect(
      service.createProduct('user-1', {
        storeId: 'store-1',
        categoryId: 'category-1',
        name: 'Zapato deportivo',
        basePrice: 59.99,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when a public product cannot be found by slug', async () => {
    prisma.product.findFirst.mockResolvedValue(null);

    await expect(
      service.findPublicProductBySlug('missing-product'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
