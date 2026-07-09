import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: {
    create: jest.Mock;
    findByEmailForAuth: jest.Mock;
    findOne: jest.Mock;
  };
  let jwtService: {
    signAsync: jest.Mock;
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

    usersService = {
      create: jest.fn(),
      findByEmailForAuth: jest.fn(),
      findOne: jest.fn(),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('access-token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('registers a user and returns an access token', async () => {
    usersService.create.mockResolvedValue(safeUser);

    const result = await service.register({
      email: 'angel@example.com',
      phone: '0999999999',
      plainPassword: 'password123',
    });

    expect(usersService.create).toHaveBeenCalledWith({
      email: 'angel@example.com',
      phone: '0999999999',
      plainPassword: 'password123',
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 'user-1',
      email: 'angel@example.com',
      role: 'CUSTOMER',
    });
    expect(result).toEqual({
      user: safeUser,
      accessToken: 'access-token',
    });
  });

  it('logs in a user with valid credentials and hides passwordHash', async () => {
    usersService.findByEmailForAuth.mockResolvedValue({
      ...safeUser,
      passwordHash: 'hashed-password',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const result = await service.login({
      email: 'angel@example.com',
      password: 'password123',
    });

    expect(bcrypt.compare).toHaveBeenCalledWith(
      'password123',
      'hashed-password',
    );
    expect(result.accessToken).toBe('access-token');
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('rejects invalid credentials', async () => {
    usersService.findByEmailForAuth.mockResolvedValue({
      ...safeUser,
      passwordHash: 'hashed-password',
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);

    await expect(
      service.login({
        email: 'angel@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns the authenticated user profile', async () => {
    usersService.findOne.mockResolvedValue(safeUser);

    await expect(service.me('user-1')).resolves.toEqual(safeUser);
    expect(usersService.findOne).toHaveBeenCalledWith('user-1');
  });
});
