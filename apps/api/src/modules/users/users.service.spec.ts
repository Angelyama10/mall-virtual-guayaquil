import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from './users.service';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      create: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
  };

  const safeUser = {
    id: 'user-1',
    email: 'angel@example.com',
    phone: '0999999999',
    role: 'CUSTOMER',
    isVerified: false,
    isPhoneVerified: false,
    isActive: true,
    isSuspended: false,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    deletedAt: null,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    prisma = {
      user: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates a user with a hashed password and does not return passwordHash', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue(safeUser);

    const result = await service.create({
      email: 'angel@example.com',
      phone: '0999999999',
      plainPassword: 'strong-password',
    });

    expect(bcrypt.hash).toHaveBeenCalledWith('strong-password', 12);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'angel@example.com',
          phone: '0999999999',
          passwordHash: 'hashed-password',
        }),
      }),
    );
    expect(result).toEqual(safeUser);
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rejects duplicated email addresses', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'existing-user',
      email: 'angel@example.com',
      phone: null,
    });

    await expect(
      service.create({
        email: 'angel@example.com',
        plainPassword: 'strong-password',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('throws NotFoundException when the user does not exist', async () => {
    prisma.user.findFirst.mockResolvedValue(null);

    await expect(service.findOne('missing-user')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('soft deletes an existing user', async () => {
    prisma.user.findFirst.mockResolvedValue(safeUser);
    prisma.user.update.mockResolvedValue({
      ...safeUser,
      deletedAt: new Date('2026-01-02T00:00:00.000Z'),
    });

    const result = await service.remove('user-1');

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'user-1' },
        data: {
          deletedAt: expect.any(Date),
        },
      }),
    );
    expect(result.deletedAt).toBeInstanceOf(Date);
  });
});
