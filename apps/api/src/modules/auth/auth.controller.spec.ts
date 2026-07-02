import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    register: jest.Mock;
    login: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates registration to AuthService', () => {
    const dto = {
      email: 'angel@example.com',
      plainPassword: 'password123',
    };

    controller.register(dto);

    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('delegates login to AuthService', () => {
    const dto = {
      email: 'angel@example.com',
      password: 'password123',
    };

    controller.login(dto);

    expect(authService.login).toHaveBeenCalledWith(dto);
  });
});
