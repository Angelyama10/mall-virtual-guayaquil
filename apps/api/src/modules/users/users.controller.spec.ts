import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: {
    create: jest.Mock;
    findAll: jest.Mock;
    findOne: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    usersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: usersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates user creation to UsersService', () => {
    const dto = {
      email: 'angel@example.com',
      plainPassword: 'strong-password',
    };

    controller.create(dto);

    expect(usersService.create).toHaveBeenCalledWith(dto);
  });

  it('delegates user update to UsersService', () => {
    const dto = {
      phone: '0999999999',
    };

    controller.update('user-1', dto);

    expect(usersService.update).toHaveBeenCalledWith('user-1', dto);
  });
});
