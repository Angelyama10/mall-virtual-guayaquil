import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { StoreStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { StoresService } from './stores.service';

describe('StoresService', () => {
  let service: StoresService;
  let prisma: {
    merchantProfile: {
      findFirst: jest.Mock;
      create: jest.Mock;
    };
    merchantCompany: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    store: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    auditLog: {
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const merchantProfile = {
    id: 'merchant-profile-1',
    userId: 'user-1',
    contactEmail: 'merchant@example.com',
    contactPhone: '0999999999',
  };

  const company = {
    id: 'company-1',
    merchantId: 'merchant-profile-1',
    name: 'Angel Store',
    slug: 'angel-store',
  };

  const store = {
    id: 'store-1',
    companyId: 'company-1',
    name: 'Angel Store Centro',
    slug: 'angel-store-centro',
  };

  beforeEach(async () => {
    prisma = {
      merchantProfile: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      merchantCompany: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      store: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoresService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<StoresService>(StoresService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a merchant profile for the authenticated merchant', async () => {
    prisma.merchantProfile.findFirst.mockResolvedValue(null);
    prisma.merchantProfile.create.mockResolvedValue(merchantProfile);

    const result = await service.createMerchantProfile('user-1', {
      contactEmail: 'merchant@example.com',
      contactPhone: '0999999999',
    });

    expect(prisma.merchantProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'user-1',
          contactEmail: 'merchant@example.com',
          contactPhone: '0999999999',
        }),
      }),
    );
    expect(result).toEqual(merchantProfile);
  });

  it('rejects duplicate merchant profiles', async () => {
    prisma.merchantProfile.findFirst.mockResolvedValue(merchantProfile);

    await expect(
      service.createMerchantProfile('user-1', {
        contactEmail: 'merchant@example.com',
        contactPhone: '0999999999',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('requires a merchant profile before creating a company', async () => {
    prisma.merchantProfile.findFirst.mockResolvedValue(null);

    await expect(
      service.createCompany('user-1', {
        name: 'Angel Store',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates a merchant company with a generated slug', async () => {
    prisma.merchantProfile.findFirst.mockResolvedValue(merchantProfile);
    prisma.merchantCompany.findUnique.mockResolvedValue(null);
    prisma.merchantCompany.create.mockResolvedValue(company);

    const result = await service.createCompany('user-1', {
      name: 'Angel Store',
    });

    expect(prisma.merchantCompany.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          merchantId: 'merchant-profile-1',
          name: 'Angel Store',
          slug: 'angel-store',
        }),
      }),
    );
    expect(result).toEqual(company);
  });

  it('creates a store for a company owned by the merchant', async () => {
    prisma.merchantCompany.findFirst.mockResolvedValue(company);
    prisma.store.findUnique.mockResolvedValue(null);
    prisma.store.create.mockResolvedValue(store);

    const result = await service.createStore('user-1', {
      companyId: 'company-1',
      name: 'Angel Store Centro',
      address: {
        street: 'Av. Principal 123',
        city: 'Guayaquil',
      },
      settings: {
        whatsappNumber: '0999999999',
      },
    });

    expect(prisma.store.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-1',
          name: 'Angel Store Centro',
          slug: 'angel-store-centro',
          address: {
            create: expect.objectContaining({
              street: 'Av. Principal 123',
              city: 'Guayaquil',
            }),
          },
          settings: {
            create: expect.objectContaining({
              whatsappNumber: '0999999999',
            }),
          },
        }),
      }),
    );
    expect(result).toEqual(store);
  });

  it('throws when a public store cannot be found by slug', async () => {
    prisma.store.findFirst.mockResolvedValue(null);

    await expect(
      service.findPublicStoreBySlug('missing-store'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('updates store status for admin approval flows', async () => {
    prisma.store.findFirst.mockResolvedValue({
      ...store,
      status: StoreStatus.PENDING_REVIEW,
      isOpen: false,
    });
    const activeStore = {
      ...store,
      status: StoreStatus.ACTIVE,
    };
    prisma.store.update.mockReturnValue('store-update');
    prisma.auditLog.create.mockReturnValue('audit-log-create');
    prisma.$transaction.mockResolvedValue([activeStore]);

    const result = await service.updateStoreStatus(
      {
        id: 'admin-1',
        email: 'admin@example.com',
        role: 'ADMIN',
      },
      'store-1',
      {
        status: StoreStatus.ACTIVE,
        note: 'Approved',
      },
    );

    expect(prisma.store.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'store-1' },
        data: {
          status: StoreStatus.ACTIVE,
          isOpen: undefined,
        },
      }),
    );
    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'admin-1',
          action: 'STORE_STATUS_UPDATED',
          entityType: 'Store',
          entityId: 'store-1',
          metadata: {
            note: 'Approved',
          },
        }),
      }),
    );
    expect(result.status).toBe(StoreStatus.ACTIVE);
  });
});
