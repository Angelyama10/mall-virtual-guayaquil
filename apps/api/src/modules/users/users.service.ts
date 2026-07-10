import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_SAFE_SELECT = {
  id: true,
  email: true,
  phone: true,
  role: true,
  isVerified: true,
  isPhoneVerified: true,
  isActive: true,
  isSuspended: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.UserSelect;

const PASSWORD_HASH_ROUNDS = 12;

const ADDRESS_SELECT = {
  id: true,
  userId: true,
  countryId: true,
  label: true,
  street: true,
  city: true,
  state: true,
  postalCode: true,
  reference: true,
  latitude: true,
  longitude: true,
  isDefault: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} satisfies Prisma.AddressSelect;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    await this.ensureEmailAndPhoneAreAvailable(dto.email, dto.phone);

    const passwordHash = await bcrypt.hash(
      dto.plainPassword,
      PASSWORD_HASH_ROUNDS,
    );

    return this.prisma.user.create({
      select: USER_SAFE_SELECT,
      data: {
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: dto.role,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: USER_SAFE_SELECT,
      where: {
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      select: USER_SAFE_SELECT,
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmailForAuth(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);

    if (dto.email || dto.phone) {
      await this.ensureEmailAndPhoneAreAvailable(dto.email, dto.phone, id);
    }

    const data: Prisma.UserUpdateInput = {
      email: dto.email,
      phone: dto.phone,
      role: dto.role,
    };

    if (dto.plainPassword) {
      data.passwordHash = await bcrypt.hash(
        dto.plainPassword,
        PASSWORD_HASH_ROUNDS,
      );
      data.passwordChangedAt = new Date();
    }

    return this.prisma.user.update({
      select: USER_SAFE_SELECT,
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.user.update({
      select: USER_SAFE_SELECT,
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  findMyAddresses(userId: string) {
    return this.prisma.address.findMany({
      select: ADDRESS_SELECT,
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findMyAddress(userId: string, addressId: string) {
    return this.findAddressOrThrow(userId, addressId);
  }

  async createMyAddress(userId: string, dto: CreateAddressDto) {
    const existingAddressCount = await this.prisma.address.count({
      where: {
        userId,
        deletedAt: null,
      },
    });
    const shouldBeDefault = dto.isDefault ?? existingAddressCount === 0;
    const createAddress = this.prisma.address.create({
      select: ADDRESS_SELECT,
      data: {
        userId,
        countryId: dto.countryId,
        label: dto.label,
        street: dto.street,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        reference: dto.reference,
        latitude: dto.latitude,
        longitude: dto.longitude,
        isDefault: shouldBeDefault,
      },
    });

    if (!shouldBeDefault) {
      return createAddress;
    }

    const [, address] = await this.prisma.$transaction([
      this.prisma.address.updateMany({
        where: {
          userId,
          deletedAt: null,
        },
        data: {
          isDefault: false,
        },
      }),
      createAddress,
    ]);

    return address;
  }

  async updateMyAddress(
    userId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ) {
    await this.findAddressOrThrow(userId, addressId);

    const updateAddress = this.prisma.address.update({
      select: ADDRESS_SELECT,
      where: { id: addressId },
      data: {
        countryId: dto.countryId,
        label: dto.label,
        street: dto.street,
        city: dto.city,
        state: dto.state,
        postalCode: dto.postalCode,
        reference: dto.reference,
        latitude: dto.latitude,
        longitude: dto.longitude,
        isDefault: dto.isDefault,
      },
    });

    if (!dto.isDefault) {
      return updateAddress;
    }

    const [, address] = await this.prisma.$transaction([
      this.prisma.address.updateMany({
        where: {
          userId,
          id: { not: addressId },
          deletedAt: null,
        },
        data: {
          isDefault: false,
        },
      }),
      updateAddress,
    ]);

    return address;
  }

  async setDefaultAddress(userId: string, addressId: string) {
    await this.findAddressOrThrow(userId, addressId);

    const [, address] = await this.prisma.$transaction([
      this.prisma.address.updateMany({
        where: {
          userId,
          deletedAt: null,
        },
        data: {
          isDefault: false,
        },
      }),
      this.prisma.address.update({
        select: ADDRESS_SELECT,
        where: { id: addressId },
        data: {
          isDefault: true,
        },
      }),
    ]);

    return address;
  }

  async removeMyAddress(userId: string, addressId: string) {
    const address = await this.findAddressOrThrow(userId, addressId);
    const removedAddress = await this.prisma.address.update({
      select: ADDRESS_SELECT,
      where: { id: addressId },
      data: {
        deletedAt: new Date(),
        isDefault: false,
      },
    });

    if (!address.isDefault) {
      return removedAddress;
    }

    const nextAddress = await this.prisma.address.findFirst({
      where: {
        userId,
        id: { not: addressId },
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (nextAddress) {
      await this.prisma.address.update({
        where: { id: nextAddress.id },
        data: {
          isDefault: true,
        },
      });
    }

    return removedAddress;
  }

  private async ensureEmailAndPhoneAreAvailable(
    email?: string,
    phone?: string,
    currentUserId?: string,
  ) {
    const filters: Prisma.UserWhereInput[] = [];

    if (email) {
      filters.push({ email });
    }

    if (phone) {
      filters.push({ phone });
    }

    if (filters.length === 0) {
      return;
    }

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: filters,
        deletedAt: null,
        ...(currentUserId ? { id: { not: currentUserId } } : {}),
      },
    });

    if (!existingUser) {
      return;
    }

    if (email && existingUser.email === email) {
      throw new ConflictException('Email is already in use');
    }

    throw new ConflictException('Phone is already in use');
  }

  private async findAddressOrThrow(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      select: ADDRESS_SELECT,
      where: {
        id: addressId,
        userId,
        deletedAt: null,
      },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }
}
