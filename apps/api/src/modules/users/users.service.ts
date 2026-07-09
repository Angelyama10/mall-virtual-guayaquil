import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
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
}
