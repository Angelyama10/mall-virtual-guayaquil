import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { CategoriesService } from './categories.service';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: {
    category: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const category = {
    id: 'category-1',
    name: 'Ropa',
    slug: 'ropa',
    isActive: true,
  };

  beforeEach(async () => {
    prisma = {
      category: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('lists public active categories', async () => {
    prisma.category.findMany.mockResolvedValue([category]);

    const result = await service.findPublicCategories();

    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true,
          deletedAt: null,
        },
      }),
    );
    expect(result).toEqual([category]);
  });

  it('creates a category with a generated slug', async () => {
    prisma.category.findFirst.mockResolvedValue(null);
    prisma.category.create.mockResolvedValue(category);

    const result = await service.create({
      name: 'Ropa',
    });

    expect(prisma.category.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'Ropa',
          slug: 'ropa',
        }),
      }),
    );
    expect(result).toEqual(category);
  });

  it('rejects duplicate category names', async () => {
    prisma.category.findFirst.mockResolvedValue(category);

    await expect(
      service.create({
        name: 'Ropa',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
