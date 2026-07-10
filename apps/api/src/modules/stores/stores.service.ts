import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, StoreStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CreateMerchantCompanyDto } from './dto/create-merchant-company.dto';
import { CreateMerchantProfileDto } from './dto/create-merchant-profile.dto';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreStatusDto } from './dto/update-store-status.dto';

const MERCHANT_PROFILE_SELECT = {
  id: true,
  userId: true,
  taxId: true,
  taxIdCountry: true,
  contactEmail: true,
  contactPhone: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.MerchantProfileSelect;

const COMPANY_SELECT = {
  id: true,
  merchantId: true,
  name: true,
  slug: true,
  description: true,
  logoUrl: true,
  coverUrl: true,
  website: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.MerchantCompanySelect;

const STORE_SELECT = {
  id: true,
  companyId: true,
  countryId: true,
  name: true,
  slug: true,
  status: true,
  openingHours: true,
  isOpen: true,
  averageRating: true,
  reviewCount: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  company: {
    select: {
      id: true,
      name: true,
      slug: true,
    },
  },
  address: true,
  settings: true,
} satisfies Prisma.StoreSelect;

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async createMerchantProfile(userId: string, dto: CreateMerchantProfileDto) {
    const existingProfile = await this.prisma.merchantProfile.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });

    if (existingProfile) {
      throw new ConflictException('Merchant profile already exists');
    }

    return this.prisma.merchantProfile.create({
      select: MERCHANT_PROFILE_SELECT,
      data: {
        userId,
        taxId: dto.taxId,
        taxIdCountry: dto.taxIdCountry,
        contactEmail: dto.contactEmail,
        contactPhone: dto.contactPhone,
      },
    });
  }

  async createCompany(userId: string, dto: CreateMerchantCompanyDto) {
    const merchantProfile = await this.findMerchantProfileOrThrow(userId);
    const slug = await this.buildUniqueCompanySlug(dto.slug ?? dto.name);

    return this.prisma.merchantCompany.create({
      select: COMPANY_SELECT,
      data: {
        merchantId: merchantProfile.id,
        name: dto.name,
        slug,
        description: dto.description,
        logoUrl: dto.logoUrl,
        coverUrl: dto.coverUrl,
        website: dto.website,
      },
    });
  }

  async createStore(userId: string, dto: CreateStoreDto) {
    const company = await this.findMerchantCompanyOrThrow(
      userId,
      dto.companyId,
    );
    const slug = await this.buildUniqueStoreSlug(dto.slug ?? dto.name);

    return this.prisma.store.create({
      select: STORE_SELECT,
      data: {
        companyId: company.id,
        countryId: dto.countryId,
        name: dto.name,
        slug,
        openingHours: dto.openingHours as Prisma.InputJsonValue,
        address: {
          create: {
            countryId: dto.address.countryId ?? dto.countryId,
            street: dto.address.street,
            city: dto.address.city,
            state: dto.address.state,
            postalCode: dto.address.postalCode,
            reference: dto.address.reference,
            latitude: dto.address.latitude,
            longitude: dto.address.longitude,
          },
        },
        settings: dto.settings
          ? {
              create: {
                whatsappNumber: dto.settings.whatsappNumber,
                instagramUrl: dto.settings.instagramUrl,
                tiktokUrl: dto.settings.tiktokUrl,
                websiteUrl: dto.settings.websiteUrl,
                acceptsWhatsapp: dto.settings.acceptsWhatsapp,
                acceptsCash: dto.settings.acceptsCash,
                acceptsCard: dto.settings.acceptsCard,
                acceptsOnlinePayment: dto.settings.acceptsOnlinePayment,
                deliveryRadiusKm: dto.settings.deliveryRadiusKm,
                averagePreparationMinutes:
                  dto.settings.averagePreparationMinutes,
                minimumOrderAmount: dto.settings.minimumOrderAmount,
                freeDeliveryFromAmount: dto.settings.freeDeliveryFromAmount,
              },
            }
          : undefined,
      },
    });
  }

  findPublicStores() {
    return this.prisma.store.findMany({
      select: STORE_SELECT,
      where: {
        status: StoreStatus.ACTIVE,
        deletedAt: null,
        company: {
          isActive: true,
          deletedAt: null,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findAllForAdmin() {
    return this.prisma.store.findMany({
      select: STORE_SELECT,
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findPendingStoresForAdmin() {
    return this.prisma.store.findMany({
      select: STORE_SELECT,
      where: {
        status: StoreStatus.PENDING_REVIEW,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async updateStoreStatus(
    actor: AuthenticatedUser,
    storeId: string,
    dto: UpdateStoreStatusDto,
  ) {
    const store = await this.findStoreOrThrow(storeId);

    const closingStatuses: StoreStatus[] = [
      StoreStatus.PAUSED,
      StoreStatus.REJECTED,
      StoreStatus.SUSPENDED,
    ];
    const shouldCloseStore = closingStatuses.includes(dto.status);

    const [updatedStore] = await this.prisma.$transaction([
      this.prisma.store.update({
        select: STORE_SELECT,
        where: { id: storeId },
        data: {
          status: dto.status,
          isOpen: shouldCloseStore ? false : undefined,
        },
      }),
      this.prisma.auditLog.create({
        data: {
          userId: actor.id,
          userRole: actor.role,
          action: 'STORE_STATUS_UPDATED',
          entityType: 'Store',
          entityId: storeId,
          oldValue: {
            status: store.status,
            isOpen: store.isOpen,
          },
          newValue: {
            status: dto.status,
            isOpen: shouldCloseStore ? false : store.isOpen,
          },
          metadata: dto.note
            ? {
                note: dto.note,
              }
            : undefined,
        },
      }),
    ]);

    return updatedStore;
  }

  async findPublicStoreBySlug(slug: string) {
    const store = await this.prisma.store.findFirst({
      select: STORE_SELECT,
      where: {
        slug,
        status: StoreStatus.ACTIVE,
        deletedAt: null,
        company: {
          isActive: true,
          deletedAt: null,
        },
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }

  findMyStores(userId: string) {
    return this.prisma.store.findMany({
      select: STORE_SELECT,
      where: {
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  private async findMerchantProfileOrThrow(userId: string) {
    const merchantProfile = await this.prisma.merchantProfile.findFirst({
      where: {
        userId,
        deletedAt: null,
      },
    });

    if (!merchantProfile) {
      throw new NotFoundException('Merchant profile is required');
    }

    return merchantProfile;
  }

  private async findStoreOrThrow(storeId: string) {
    const store = await this.prisma.store.findFirst({
      where: {
        id: storeId,
        deletedAt: null,
      },
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    return store;
  }

  private async findMerchantCompanyOrThrow(userId: string, companyId: string) {
    const company = await this.prisma.merchantCompany.findFirst({
      where: {
        id: companyId,
        deletedAt: null,
        merchant: {
          is: {
            userId,
            deletedAt: null,
          },
        },
      },
    });

    if (!company) {
      throw new NotFoundException('Merchant company not found');
    }

    return company;
  }

  private async buildUniqueCompanySlug(value: string) {
    return this.buildUniqueSlug(value, async (slug) => {
      const company = await this.prisma.merchantCompany.findUnique({
        where: { slug },
      });

      return Boolean(company);
    });
  }

  private async buildUniqueStoreSlug(value: string) {
    return this.buildUniqueSlug(value, async (slug) => {
      const store = await this.prisma.store.findUnique({
        where: { slug },
      });

      return Boolean(store);
    });
  }

  private async buildUniqueSlug(
    value: string,
    exists: (slug: string) => Promise<boolean>,
  ) {
    const baseSlug = this.slugify(value);
    let candidate = baseSlug;
    let suffix = 2;

    while (await exists(candidate)) {
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
